import React from 'react'
import axios from 'axios';
import ipRangeCheck from 'ip-range-check'

export async function isRWAN(): Promise<boolean> {
    const response = await axios.get("http://ip-api.com/json");
    return ipRangeCheck(response.data.query as string, "133.139.0.0/16");
}
