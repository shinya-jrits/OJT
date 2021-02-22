import axios from 'axios';
import ipRangeCheck from 'ip-range-check';

export async function isRWAN(): Promise<boolean> {
    const response = await axios.get('https://ipinfo.io/json')
    console.log(response);
    return ipRangeCheck(response.data.ip as string, "133.139.0.0/16");
}
