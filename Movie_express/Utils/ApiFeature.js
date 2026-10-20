class ApiFeature {
     constructor(query, queryString) {
         this.query = query;
         this.queryString = queryString;
     }

    // filtering
    filter() {
        // build the query
        let queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);
        queryObj = JSON.stringify(queryObj);
        queryObj = queryObj.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
        queryObj = JSON.parse(queryObj);

        // from { 'rating[gte]': '3' } to { rating: { $gte: 3 } }
        for (const key in queryObj) {
            if (key.includes('[')) {
                const field = key.split('[')[0];
                const operator = key.split('[')[1].split(']')[0];
                queryObj[field] = { [operator]: queryObj[key] };
                delete queryObj[key];
            }
        }

        this.query = this.query.find(queryObj);
        return this;
    }

    // sorting
    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            
            this.query = this.query.sort(sortBy);
        } else {

            this.query = this.query.sort('-createdAt');
        }
        return this;
    }

    // limiting fields
    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }
        return this;
    }

    // pagination
    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;
        
        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}

module.exports = ApiFeature;