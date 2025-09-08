const organizeSearchFeilds = require("./organizeSearchFeilds");

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = [
      "page",
      "sort",
      "limit",
      "fields",
      "searchValue",
      "skip",
      "otherCategory",
      "priceFrom",
      "priceTo",
    ];
    excludedFields.forEach((el) => delete queryObj[el]);
    // 1B) Advanced filtering
    let queryStr = JSON.stringify(queryObj);

    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lt|or)\b/g,
      (match) => `$${match}`
    );
    queryStr = JSON.parse(queryStr);
    if (
      queryStr.$or &&
      this.queryString.searchValue &&
      this.queryString.searchValue.length > 0
    ) {
      queryStr.$or = organizeSearchFeilds(
        queryStr.$or,
        this.queryString.searchValue
      );
    } else {
      delete queryStr.$or;
    }

    if (this.queryString.otherCategory === "true") {
      queryStr.sportCategory = {
        $nin: ["football", "basketball", "nfl", "fights"],
      };
    }

    // Add price range filtering
    if (this.queryString.priceFrom || this.queryString.priceTo) {
      queryStr.price = {};

      if (this.queryString.priceFrom) {
        queryStr.price.$gte = parseFloat(this.queryString.priceFrom);
      }

      if (this.queryString.priceTo) {
        queryStr.price.$lte = parseFloat(this.queryString.priceTo);
      }
    }

    this.query = this.query.find(queryStr);

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      this.query = this.query.sort(this.queryString.sort);
    } else {
      this.query = this.query.sort({ _id: 1 });
      // this.query.sort("-createdAt") || this.query.sort({ _id: 1 });
    }

    return this;
  }

  countDocs() {
    this.query = this.query.countDocuments();
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }

    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit =
      this.queryString.limit === "0" ? 0 : this.queryString.limit * 1 || 10;
    const skip = this.queryString.skip || (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}
module.exports = APIFeatures;
