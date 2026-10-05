## Create a client

Initialize the JavaScript client once with the project URL and publishable key.

```js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(projectUrl, publishableKey)
```

## Use the client

Query a table only after configuring access policies for the caller.

```js
const { data, error } = await supabase.from('instruments').select('id, name')
```

[View the current official Initializing reference](https://supabase.com/docs/reference/javascript/initializing).
