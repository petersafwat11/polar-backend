const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};
exports.createAdmin = catchAsync(async (req, res, next) => {
  // Validate required fields
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return next(
      new AppError("Please provide name, email, password and role", 400)
    );
  }

  // Check if user with email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError("User with this email already exists", 400));
  }

  // Create new admin user
  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  // Send success response without password
  user.password = undefined;
  res.status(201).json({
    status: "success",
    data: {
      user,
    },
  });
});
exports.signup = async (req, res) => {
  try {
    const { username, email, password, passwordConfirm } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        status: "fail",
        message: "User with this email or username already exists",
      });
    }

    // Create new user
    const newUser = await User.create({
      username,
      email,
      password,
      passwordConfirm,
    });

    createSendToken(newUser, 201, res);
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};
exports.login = catchAsync(async (req, res, next) => {
  const { email, username, password } = req.body;

  if (!email && !username) {
    return res.status(400).json({
      status: "fail",
      message: "Please provide email or username",
    });
  }

  if (!password) {
    return res.status(400).json({
      status: "fail",
      message: "Please provide password",
    });
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return res.status(401).json({
      status: "fail",
      message: "Incorrect email/username or password",
    });
  }

  createSendToken(user, 200, res);
});
exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.protect = catchAsync(async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "You are not logged in! Please log in to get access.",
      });
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "The user belonging to this token no longer exists.",
      });
    }

    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        status: "fail",
        message: "User recently changed password! Please log in again.",
      });
    }

    req.user = currentUser;
    next();
  } catch (err) {
    res.status(401).json({
      status: "fail",
      message: "Invalid token. Please log in again!",
    });
  }
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "There is no user with email address.",
      });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Use frontend URL instead of backend URL
    const resetURL = `${process.env.FRONTEND_URL}/changePassword?token=${resetToken}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Your password reset token (valid for 10 min)",
        message: resetURL,
      });

      res.status(200).json({
        status: "success",
        message: "Token sent to email!",
      });
    } catch (err) {
      console.error("Email sending error:", err);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        status: "fail",
        message: "There was an error sending the email. Try again later!",
      });
    }
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.resetPassword = catchAsync(async (req, res, next) => {
  try {
    // Get user based on the token
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    console.log("Attempting to reset password with token:", req.params.token);
    console.log("Hashed token:", hashedToken);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      console.log("No user found with token or token expired");
      return res.status(400).json({
        status: "fail",
        message: "Token is invalid or has expired",
      });
    }

    // Set new password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Log the user in, send JWT
    createSendToken(user, 200, res);
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("+password");

    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      return res.status(401).json({
        status: "fail",
        message: "Your current password is wrong.",
      });
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    createSendToken(user, 200, res);
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
});
exports.adminProtection = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (user.role === "Admin") {
    return next(new AppError(`admin acc can't be changed`, 401));
  }
  next();
});
exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError(`there is't a user with that id`, 404));
  }

  const { role, name } = req.body;
  user.role = role;
  user.name = name;
  if (req.body.password) {
    user.password = req.body.password;
  }
  user.save();
  res.status(201).json({
    status: "success",
    data: {
      data: user,
    },
  });
});
