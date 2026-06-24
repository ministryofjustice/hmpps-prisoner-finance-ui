import http from 'k6/http'
import { check } from 'k6'
import exec from 'k6/execution';

const domain = __ENV.DOMAIN;

console.log(__ENV)
console.log(__ENV.DOMAIN)

const httpParams = {
    headers: {
        'Content-Type': 'application/json',
    },
}

const baseUrl = `https://${domain}`

export default function verify_health() {
    const res = http.get(`${baseUrl}/health`, httpParams)

    console.log(domain)
    console.log(res.status)
    console.log(res.body)

    check(res, {
        'status is 200': r => r.status === 200,
        'body is defined': r => r.body !== undefined,
    })

    const body = res.json()
    check(body, {
        'overall status is UP': b => b.status === 'UP',
    })

    for (const [componentName, info] of Object.entries(body.components)) {
        check(info, {
            [`Component "${componentName}" status is UP (found: "${info.status}")`]: i => i.status === 'UP',
        })
    }
}
