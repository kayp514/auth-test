
import { buildRequestLike , isPrerenderingBailout} from "../utils/build-request-like"
import { constants } from "../backend"
import { getHeader } from "./header"

const client = async() => {
    try {
        const request = await buildRequestLike();
        const encryptedRequestData = getHeader(request, constants.Headers.TernSecureRequestData);
        return encryptedRequestData;
    } catch (error) {
        if (error && isPrerenderingBailout(error)) {
            throw error;
        }
    }
}

export { client }