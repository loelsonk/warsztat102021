exports.handler = (event, context, callback) => {
    const response = event.Records[0].cf.response;
    response.headers['content-type'] = [{ key:'Content-Type', value: 'text/xml' }];

    return callback(null, response);
};