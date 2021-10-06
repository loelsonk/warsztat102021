const path = require('path');

const debug = (reference, message) => console.log(
    `SITEMAP ORIGIN-REQUEST REF: ${reference} INFO: ${message}`
);

module.exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;

    debug(request.uri, `Request uri`);

    const fileName = path.basename(request.uri);

    if (!fileName.endsWith('.xml')) {
        debug(fileName, 'Requested file is not *.xml file');

        return callback(null, request);
    }

    debug(fileName, `Requested sitemap file`);

    request.uri = `/sitemap/${fileName}`;

    return callback(null, request);
};
