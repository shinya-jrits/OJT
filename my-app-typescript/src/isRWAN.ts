import axios from "axios";
import ipRangeCheck from "ip-range-check";

interface IpinfoResponse {
  ip : string
}

export async function isRWAN(): Promise<boolean> {
  try {
    const response = await axios.get<IpinfoResponse>("https://ipinfo.io/json");
    return ipRangeCheck(response.data.ip, "133.139.0.0/16");
  } catch(e) {
    const ip = await axios.get("https://ip2location.io/ip");
    return ipRangeCheck(ip, "133.139.0.0/16");
  }
}
