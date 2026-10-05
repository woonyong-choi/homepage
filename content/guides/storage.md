## Overview

Storage organizes files into buckets and serves them to applications. Access policies can be coordinated with your database and authenticated users.

### Example

The bucket and `file` must exist in your application, and Storage policies determine who may upload.

```js
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('public/avatar.png', file)
```

## Plan access

Choose whether each bucket and object is public or private. Review upload limits and transformation needs before connecting a client.

## Continue

Use [Auth](#/guides/auth) to identify users and [Database](#/guides/database) to manage related records.

[Read the current official guide](https://supabase.com/docs/guides/storage).
