"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSignedUrl = getSignedUrl;
/** Ports src/app/api/get-signed-url/route.ts — returns S3 PUT-signed URL. */
const errors_1 = require("@/utils/errors");
const storage_1 = require("@/utils/storage");
async function getSignedUrl(public_id) {
    if (!public_id)
        throw new errors_1.BadRequestError('public_id not found');
    return (0, storage_1.signUrl)(public_id);
}
//# sourceMappingURL=upload.service.js.map