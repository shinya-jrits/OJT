import axios from "axios";
import ipRangeCheck from "ip-range-check";

interface IpinfoResponse {
  ip : string
}

export async function isRWAN(): Promise<boolean> {
  const response = await axios.get<IpinfoResponse>("https://ipinfo.io/json");
  return ipRangeCheck(response.data.ip, "133.139.0.0/16");
}
