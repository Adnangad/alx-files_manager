import redis from 'redis'
const client = redis.createClient().on('error', (error) => {
    console.error(error);
})
const stat = client.on('connect', () => {
    return true;
})
console.log(stat);