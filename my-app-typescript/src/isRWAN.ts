import axios from 'axios';
import ipRangeCheck from 'ip-range-check';

export async function isRWAN(): Promise<boolean> {
    if (process.env.REACT_APP_IPINFO_URL == null) {
        throw new Error("IPinfo.ioのURLが指定されていません");
    }
    const response = await axios.get(process.env.REACT_APP_IPINFO_URL);
    return ipRangeCheck(response.data.ip as string, "133.139.0.0/16");
}
