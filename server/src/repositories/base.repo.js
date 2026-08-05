export class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  create(data) {
    return this.model.create(data);
  }

  findById(id, select) {
    return this.model.findById(id).select(select || '-__v');
  }

  findOne(query, select) {
    return this.model.findOne(query).select(select || '-__v');
  }

  findMany(query = {}, options = {}) {
    let cursor = this.model.find(query);
    if (options.select) cursor = cursor.select(options.select);
    if (options.sort) cursor = cursor.sort(options.sort);
    if (options.skip) cursor = cursor.skip(options.skip);
    if (options.limit) cursor = cursor.limit(options.limit);
    if (options.populate) cursor = cursor.populate(options.populate);
    return cursor.exec();
  }

  updateById(id, data, opts = {}) {
    return this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true, ...opts });
  }

  updateOne(query, data, opts = {}) {
    return this.model.findOneAndUpdate(query, data, { new: true, runValidators: true, ...opts });
  }

  updateMany(query, data) {
    return this.model.updateMany(query, data);
  }

  deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }

  deleteMany(query) {
    return this.model.deleteMany(query);
  }

  count(query = {}) {
    return this.model.countDocuments(query);
  }

  aggregate(pipeline) {
    return this.model.aggregate(pipeline);
  }
}
