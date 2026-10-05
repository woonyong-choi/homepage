## Generate types

Generate database types from the project schema so calls can be checked in the editor.

```sh
supabase gen types typescript --project-id PROJECT_ID > database.types.ts
```

## Create a typed client

Pass the generated database type when creating a client.

```ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabase = createClient<Database>(projectUrl, publishableKey)
```

[View the current official TypeScript reference](https://supabase.com/docs/reference/javascript/typescript-support).
