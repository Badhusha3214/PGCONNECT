// Values interpolated into a PostgREST `.or()` string must not contain its
// syntax characters, or user input can add its own filter conditions.
export const orSafe = (v: string) => v.replace(/[,()"\\]/g, ' ').trim()
