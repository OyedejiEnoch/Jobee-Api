export class APIFilters {
    constructor(query, queryStr){
        this.query=query;
        this.queryStr =queryStr
    }

    filter(){
        const queryCopy ={...this.queryStr}

        //Removing fields from the queryStr
        const removeFields =['sort', 'fields', 'q', 'limit', 'page']
        removeFields.forEach(el => delete queryCopy[el])

        // Advance filter using lt, lte, gt, gte
        let queryStr =JSON.stringify(queryCopy);

        // this is that, if there is any gt or lt or lte in the query then we need to add the dollar sign (i.e replace gt with $gt) 
        queryStr =queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`)


        // this.query =this.query.find(this.queryStr)   to get normal query;
        this.query =this.query.find(JSON.parse(queryStr));
        return this
    }

    sort() {
        if(this.queryStr.sort){

            const sortBy =this.queryStr.sort.split(',').join(' ')

            //i.e if req.query.sort
            // then this.query === Job.sort(whatever the req.query.sort value is)
            // Job.find().sort({_id:-1})
            this.query = this.query.sort(sortBy)
        }else{
            this.query =this.query.sort('-postingDate')
        }

        return this
    }

    limitFields(){

        if(this.queryStr.fields){
            const fields =this.queryStr.fields.split(',').join(' ')
            this.query = this.query.select(fields)
        }else{
            // Jpb.find().select('-__V')
            this.query = this.query.select('-__V')
        }

        return this
    }

    searchByQuery(){
        if(this.queryStr.q){
            const qu =this.queryStr.q.split('-').join(' ')
            this.query =this.query.find({$text:{$search:"\""+ qu +"\""}})
        }

        return this
    }

    pagination(){
        //we would need limit per page and the page number
        const page = parseInt(this.queryStr.page, 10) || 1 
        const limit =parseInt(this.queryStr.limit, 10) || 10

        // when page is 0 we are not skipping any result, when page is 2, we skip the first 10 results
        const skipResults = (page -1) * limit

        this.query =this.query.skip(skipResults).limit(limit)

        return this
    }
}