# Detailed Audit Report

Generated: 2025-12-29T12:38:41.520Z

## Issues Found: 0

## Raw Data

TypeScript Output:

```

> wallie@0.2.0 typecheck C:\_WALLIE
> turbo typecheck

• Packages in scope: @wallie/agents, @wallie/ai, @wallie/api, @wallie/auth, @wallie/db, @wallie/email, @wallie/realtime, @wallie/stripe, @wallie/types, @wallie/ui, @wallie/web, @wallie/whatsapp, @wallie/workers
• Running typecheck in 13 packages
• Remote caching disabled
@wallie/db:typecheck: cache miss, executing 6022d482020a71c6
@wallie/auth:typecheck: cache miss, executing f3329b952432d854
@wallie/realtime:typecheck: cache miss, executing 66f2cc4792485d2c
@wallie/types:typecheck: cache hit, replaying logs d109fef5666a361b
@wallie/types:typecheck:
@wallie/types:typecheck: > @wallie/types@0.0.1 typecheck C:\_WALLIE\packages\types
@wallie/types:typecheck: > tsc --noEmit
@wallie/types:typecheck:
@wallie/email:typecheck: cache hit, replaying logs d54acf5b83d9b83d
@wallie/stripe:typecheck: cache miss, executing be6b74a0fdfcc9b1
@wallie/email:typecheck:
@wallie/email:typecheck: > @wallie/email@0.0.1 typecheck C:\_WALLIE\packages\email
@wallie/email:typecheck: > tsc --noEmit
@wallie/email:typecheck:
@wallie/ui:typecheck: cache hit, replaying logs ff652823951a03c9
@wallie/ui:typecheck:
@wallie/ui:typecheck: > @wallie/ui@0.0.1 typecheck C:\_WALLIE\packages\ui
@wallie/ui:typecheck: > tsc --noEmit
@wallie/ui:typecheck:
@wallie/ai:typecheck: cache miss, executing 4a34c559067be57a
@wallie/whatsapp:typecheck: cache miss, executing 625d6041fce51c8e
@wallie/agents:typecheck: cache miss, executing 3a4f266385ce48d9
@wallie/api:typecheck: cache miss, executing 7b03c467a7bd0a55
@wallie/workers:typecheck: cache miss, executing 3cad22db45f86b10
@wallie/web:typecheck: cache miss, executing 74126a4afb2a9afe
@wallie/whatsapp:typecheck:
@wallie/whatsapp:typecheck: > @wallie/whatsapp@0.0.1 typecheck C:\_WALLIE\packages\whatsapp
@wallie/whatsapp:typecheck: > tsc --noEmit
@wallie/whatsapp:typecheck:
@wallie/db:typecheck:
@wallie/db:typecheck: > @wallie/db@0.0.1 typecheck C:\_WALLIE\packages\db
@wallie/db:typecheck: > tsc --noEmit
@wallie/db:typecheck:
@wallie/stripe:typecheck:
@wallie/stripe:typecheck: > @wallie/stripe@0.0.1 typecheck C:\_WALLIE\packages\stripe
@wallie/stripe:typecheck: > tsc --noEmit
@wallie/stripe:typecheck:
@wallie/realtime:typecheck:
@wallie/realtime:typecheck: > @wallie/realtime@0.0.1 typecheck C:\_WALLIE\packages\realtime
@wallie/realtime:typecheck: > tsc --noEmit
@wallie/realtime:typecheck:
@wallie/ai:typecheck:
@wallie/ai:typecheck: > @wallie/ai@0.0.1 typecheck C:\_WALLIE\packages\ai
@wallie/ai:typecheck: > tsc --noEmit
@wallie/api:typecheck:
@wallie/ai:typecheck:
@wallie/api:typecheck: > @wallie/api@0.0.1 typecheck C:\_WALLIE\packages\api
@wallie/api:typecheck: > tsc --noEmit
@wallie/api:typecheck:
@wallie/workers:typecheck:
@wallie/workers:typecheck: > @wallie/workers@0.0.1 typecheck C:\_WALLIE\packages\workers
@wallie/workers:typecheck: > tsc --noEmit
@wallie/workers:typecheck:
@wallie/auth:typecheck:
@wallie/auth:typecheck: > @wallie/auth@0.0.1 typecheck C:\_WALLIE\packages\auth
@wallie/auth:typecheck: > tsc --noEmit
@wallie/agents:typecheck:
@wallie/agents:typecheck: > @wallie/agents@0.0.1 typecheck C:\_WALLIE\packages\agents
@wallie/agents:typecheck: > tsc --noEmit
@wallie/auth:typecheck:
@wallie/agents:typecheck:
@wallie/web:typecheck:
@wallie/web:typecheck: > @wallie/web@0.0.1 typecheck C:\_WALLIE\apps\web
@wallie/web:typecheck: > tsc --noEmit
@wallie/web:typecheck:
@wallie/ai:typecheck: src/index.ts(373,3): error TS2305: Module '"./providers/types"' has no exported member 'ToolDefinition'.
@wallie/ai:typecheck: src/index.ts(374,3): error TS2305: Module '"./providers/types"' has no exported member 'ToolCall'.
@wallie/ai:typecheck: src/index.ts(375,3): error TS2305: Module '"./providers/types"' has no exported member 'ToolResult'.
@wallie/ai:typecheck: src/index.ts(376,3): error TS2305: Module '"./providers/types"' has no exported member 'ToolMessage'.
@wallie/ai:typecheck: src/index.ts(377,3): error TS2305: Module '"./providers/types"' has no exported member 'ToolParameterSchema'.
@wallie/ai:typecheck: src/providers/litellm.ts(150,7): error TS2322: Type '"litellm"' is not assignable to type 'AIProviderType'.
@wallie/ai:typecheck: src/providers/litellm.ts(214,3): error TS2322: Type '"litellm"' is not assignable to type 'AIProviderType'.
@wallie/ai:typecheck: src/providers/litellm.ts(243,9): error TS2322: Type '"litellm"' is not assignable to type 'AIProviderType'.
@wallie/ai:typecheck: src/providers/litellm.ts(258,9): error TS2322: Type '"litellm"' is not assignable to type 'AIProviderType'.
@wallie/ai:typecheck: src/providers/litellm.ts(273,9): error TS2322: Type '"litellm"' is not assignable to type 'AIProviderType'.
@wallie/ai:typecheck: src/providers/litellm.ts(288,9): error TS2322: Type '"litellm"' is not assignable to type 'AIProviderType'.
@wallie/ai:typecheck: src/providers/openai.ts(15,3): error TS2305: Module '"./types"' has no exported member 'ToolDefinition'.
@wallie/ai:typecheck: src/providers/openai.ts(16,3): error TS2305: Module '"./types"' has no exported member 'ToolCall'.
@wallie/ai:typecheck: src/providers/openai.ts(114,19): error TS2339: Property 'cachedSystemBlocks' does not exist on type 'GenerateRequest'.
@wallie/ai:typecheck: src/providers/openai.ts(114,49): error TS2339: Property 'cachedSystemBlocks' does not exist on type 'GenerateRequest'.
@wallie/ai:typecheck: src/providers/openai.ts(116,39): error TS2339: Property 'cachedSystemBlocks' does not exist on type 'GenerateRequest'.
@wallie/ai:typecheck: src/providers/openai.ts(116,63): error TS7006: Parameter 'b' implicitly has an 'any' type.
@wallie/ai:typecheck: src/providers/openai.ts(129,19): error TS2339: Property 'messages' does not exist on type 'GenerateRequest'.
@wallie/ai:typecheck: src/providers/openai.ts(130,35): error TS2339: Property 'messages' does not exist on type 'GenerateRequest'.
@wallie/ai:typecheck: src/providers/openai.ts(139,48): error TS7006: Parameter 'tc' implicitly has an 'any' type.
@wallie/ai:typecheck: src/providers/openai.ts(168,29): error TS2339: Property 'tools' does not exist on type 'GenerateRequest'.
@wallie/ai:typecheck: src/providers/openai.ts(168,80): error TS2339: Property 'tools' does not exist on type 'GenerateRequest'.
@wallie/ai:typecheck: src/providers/openai.ts(200,42): error TS2339: Property 'finishReason' does not exist on type 'GenerateResponse'.
@wallie/ai:typecheck: src/providers/openai.ts(221,9): error TS2353: Object literal may only specify known properties, and 'toolCalls' does not exist in type 'GenerateResponse'.
@wallie/ai:typecheck: src/tools/definitions.ts(12,15): error TS2305: Module '"../providers/types"' has no exported member 'ToolDefinition'.
@wallie/ai:typecheck: src/tools/index.ts(39,3): error TS2305: Module '"../providers/types"' has no exported member 'ToolDefinition'.
@wallie/ai:typecheck: src/tools/index.ts(40,3): error TS2305: Module '"../providers/types"' has no exported member 'ToolCall'.
@wallie/ai:typecheck: src/tools/index.ts(41,3): error TS2305: Module '"../providers/types"' has no exported member 'ToolResult'.
@wallie/ai:typecheck: src/tools/index.ts(42,3): error TS2305: Module '"../providers/types"' has no exported member 'ToolMessage'.
@wallie/ai:typecheck: src/tools/index.ts(43,3): error TS2305: Module '"../providers/types"' has no exported member 'ToolParameterSchema'.
@wallie/ai:typecheck:  ELIFECYCLE  Command failed with exit code 2.

 Tasks:    6 successful, 13 total
Cached:    3 cached, 13 total
  Time:    7.213s
Failed:    @wallie/ai#typecheck


• turbo 2.7.2
@wallie/ai:typecheck: ERROR: command finished with error: command (C:\_WALLIE\packages\ai) C:\Users\Usuario\AppData\Local\pnpm\.tools\pnpm\8.15.0\bin\pnpm.CMD run typecheck exited (1)
@wallie/ai#typecheck: command (C:\_WALLIE\packages\ai) C:\Users\Usuario\AppData\Local\pnpm\.tools\pnpm\8.15.0\bin\pnpm.CMD run typecheck exited (1)
 ERROR  run failed: command  exited (1)

```

ESLint Output:

```

> wallie@0.2.0 lint C:\_WALLIE
> turbo lint

• Packages in scope: @wallie/agents, @wallie/ai, @wallie/api, @wallie/auth, @wallie/db, @wallie/email, @wallie/realtime, @wallie/stripe, @wallie/types, @wallie/ui, @wallie/web, @wallie/whatsapp, @wallie/workers
• Running lint in 13 packages
• Remote caching disabled
@wallie/email:lint: cache hit, replaying logs 8814955f0ba53a97
@wallie/email:lint:
@wallie/email:lint: > @wallie/email@0.0.1 lint C:\_WALLIE\packages\email
@wallie/email:lint: > eslint src/
@wallie/email:lint:
@wallie/stripe:lint: cache hit, replaying logs a0f0c06db313073f
@wallie/web:lint: cache miss, executing 67ebf434866e73ee
@wallie/ai:lint: cache miss, executing 8f47d238436a1d50
@wallie/whatsapp:lint: cache hit, replaying logs 4a26fb0717223511
@wallie/whatsapp:lint:
@wallie/whatsapp:lint: > @wallie/whatsapp@0.0.1 lint C:\_WALLIE\packages\whatsapp
@wallie/whatsapp:lint: > eslint src/
@wallie/whatsapp:lint:
@wallie/api:lint: cache hit, replaying logs f8ef454f926d6779
@wallie/api:lint:
@wallie/api:lint: > @wallie/api@0.0.1 lint C:\_WALLIE\packages\api
@wallie/api:lint: > eslint src/
@wallie/api:lint:
@wallie/api:lint:
@wallie/api:lint: C:\_WALLIE\packages\api\src\__tests__\goals-validation.test.ts
@wallie/api:lint:   58:15  warning  'benefit' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
@wallie/api:lint:
@wallie/api:lint: ✖ 1 problem (0 errors, 1 warning)
@wallie/api:lint:
@wallie/auth:lint: cache hit, replaying logs 0b77b08b9fc844fb
@wallie/auth:lint:
@wallie/auth:lint: > @wallie/auth@0.0.1 lint C:\_WALLIE\packages\auth
@wallie/auth:lint: > eslint src/
@wallie/auth:lint:
@wallie/workers:lint: cache hit, replaying logs 77adc667ea7d8288
@wallie/workers:lint:
@wallie/workers:lint: > @wallie/workers@0.0.1 lint C:\_WALLIE\packages\workers
@wallie/workers:lint: > eslint src --ext .ts,.tsx
@wallie/workers:lint:
@wallie/agents:lint: cache hit, replaying logs 97d08062899aa763
@wallie/stripe:lint:
@wallie/stripe:lint: > @wallie/stripe@0.0.1 lint C:\_WALLIE\packages\stripe
@wallie/stripe:lint: > eslint src/
@wallie/stripe:lint:
@wallie/db:lint: cache hit, replaying logs f940c3d60e78c02e
@wallie/db:lint:
@wallie/db:lint: > @wallie/db@0.0.1 lint C:\_WALLIE\packages\db
@wallie/db:lint: > eslint src/
@wallie/db:lint:
@wallie/ui:lint: cache hit, replaying logs 5f68624789bff84b
@wallie/ui:lint:
@wallie/ui:lint: > @wallie/ui@0.0.1 lint C:\_WALLIE\packages\ui
@wallie/ui:lint: > eslint src/
@wallie/ui:lint:
@wallie/realtime:lint: cache hit, replaying logs a06efb88ca22d208
@wallie/types:lint: cache hit, replaying logs 5951560e5147171f
@wallie/agents:lint:
@wallie/agents:lint: > @wallie/agents@0.0.1 lint C:\_WALLIE\packages\agents
@wallie/agents:lint: > eslint src/
@wallie/agents:lint:
@wallie/types:lint:
@wallie/types:lint: > @wallie/types@0.0.1 lint C:\_WALLIE\packages\types
@wallie/types:lint: > eslint src/
@wallie/types:lint:
@wallie/realtime:lint:
@wallie/realtime:lint: > @wallie/realtime@0.0.1 lint C:\_WALLIE\packages\realtime
@wallie/realtime:lint: > eslint src/
@wallie/realtime:lint:
@wallie/realtime:lint:
@wallie/realtime:lint: C:\_WALLIE\packages\realtime\src\__tests__\realtime.test.ts
@wallie/realtime:lint:   248:9  warning  Async arrow function 'broadcastNewMessage' has no 'await' expression  @typescript-eslint/require-await
@wallie/realtime:lint:   270:9  warning  Async arrow function 'broadcastTyping' has no 'await' expression      @typescript-eslint/require-await
@wallie/realtime:lint:   289:9  warning  Async arrow function 'broadcastTyping' has no 'await' expression      @typescript-eslint/require-await
@wallie/realtime:lint:   350:7  warning  Async arrow function 'broadcastToMultiple' has no 'await' expression  @typescript-eslint/require-await
@wallie/realtime:lint:
@wallie/realtime:lint: C:\_WALLIE\packages\realtime\src\hooks\use-realtime-messages.ts
@wallie/realtime:lint:   65:29  warning  'Channel' is an 'error' type that acts as 'any' and overrides all other types in this union type  @typescript-eslint/no-redundant-type-constituents
@wallie/realtime:lint:   78:13  warning  Unsafe assignment of an error typed value                                                         @typescript-eslint/no-unsafe-assignment
@wallie/realtime:lint:   79:7   warning  Unsafe assignment of an error typed value                                                         @typescript-eslint/no-unsafe-assignment
@wallie/realtime:lint:
@wallie/realtime:lint: C:\_WALLIE\packages\realtime\src\hooks\use-realtime-notifications.ts
@wallie/realtime:lint:   94:13  warning  Unsafe assignment of an error typed value  @typescript-eslint/no-unsafe-assignment
@wallie/realtime:lint:
@wallie/realtime:lint: C:\_WALLIE\packages\realtime\src\pusher-client.ts
@wallie/realtime:lint:    51:27  warning  'PusherClient' is an 'error' type that acts as 'any' and overrides all other types in this union type  @typescript-eslint/no-redundant-type-constituents
@wallie/realtime:lint:    70:15  warning  Unsafe member access .wsHost on an `error` typed value                                                 @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:    71:15  warning  Unsafe member access .wsPort on an `error` typed value                                                 @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:    72:15  warning  Unsafe member access .forceTLS on an `error` typed value                                               @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:    73:15  warning  Unsafe member access .enabledTransports on an `error` typed value                                      @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:    76:5   warning  Unsafe assignment of an error typed value                                                              @typescript-eslint/no-unsafe-assignment
@wallie/realtime:lint:    76:28  warning  Unsafe construction of a(n) `error` type typed value                                                   @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:    87:5   warning  Unsafe call of a(n) `error` type typed value                                                           @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:    87:26  warning  Unsafe member access .disconnect on an `error` typed value                                             @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:   100:9   warning  Unsafe assignment of an error typed value                                                              @typescript-eslint/no-unsafe-assignment
@wallie/realtime:lint:   103:10  warning  Unsafe call of a(n) `error` type typed value                                                           @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   103:17  warning  Unsafe member access .subscribe on an `error` typed value                                              @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:   110:9   warning  Unsafe assignment of an error typed value                                                              @typescript-eslint/no-unsafe-assignment
@wallie/realtime:lint:   113:10  warning  Unsafe call of a(n) `error` type typed value                                                           @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   113:17  warning  Unsafe member access .subscribe on an `error` typed value                                              @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:   120:9   warning  Unsafe assignment of an error typed value                                                              @typescript-eslint/no-unsafe-assignment
@wallie/realtime:lint:   123:10  warning  Unsafe call of a(n) `error` type typed value                                                           @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   123:17  warning  Unsafe member access .subscribe on an `error` typed value                                              @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:   130:9   warning  Unsafe assignment of an error typed value                                                              @typescript-eslint/no-unsafe-assignment
@wallie/realtime:lint:   131:3   warning  Unsafe call of a(n) `error` type typed value                                                           @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   131:10  warning  Unsafe member access .unsubscribe on an `error` typed value                                            @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:   142:3   warning  Unsafe call of a(n) `error` type typed value                                                           @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   142:11  warning  Unsafe member access .bind on an `error` typed value                                                   @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:   145:16  warning  Unsafe return of a value of type error                                                                 @typescript-eslint/no-unsafe-return
@wallie/realtime:lint:   145:16  warning  Unsafe call of a(n) `error` type typed value                                                           @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   145:24  warning  Unsafe member access .unbind on an `error` typed value                                                 @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:   155:3   warning  Unsafe call of a(n) `error` type typed value                                                           @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   155:11  warning  Unsafe member access .bind on an `error` typed value                                                   @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:   156:3   warning  Unsafe call of a(n) `error` type typed value                                                           @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   156:11  warning  Unsafe member access .bind on an `error` typed value                                                   @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:   159:5   warning  Unsafe call of a(n) `error` type typed value                                                           @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   159:13  warning  Unsafe member access .unbind on an `error` typed value                                                 @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:   160:5   warning  Unsafe call of a(n) `error` type typed value                                                           @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   160:13  warning  Unsafe member access .unbind on an `error` typed value                                                 @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:   168:3   warning  Unsafe call of a(n) `error` type typed value                                                           @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   168:11  warning  Unsafe member access .bind on an `error` typed value                                                   @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:   170:16  warning  Unsafe return of a value of type error                                                                 @typescript-eslint/no-unsafe-return
@wallie/realtime:lint:   170:16  warning  Unsafe call of a(n) `error` type typed value                                                           @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   170:24  warning  Unsafe member access .unbind on an `error` typed value                                                 @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:   177:3   warning  Unsafe call of a(n) `error` type typed value                                                           @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   177:11  warning  Unsafe member access .bind on an `error` typed value                                                   @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:   179:16  warning  Unsafe return of a value of type error                                                                 @typescript-eslint/no-unsafe-return
@wallie/realtime:lint:   179:16  warning  Unsafe call of a(n) `error` type typed value                                                           @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   179:24  warning  Unsafe member access .unbind on an `error` typed value                                                 @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:   192:9   warning  Unsafe assignment of an error typed value                                                              @typescript-eslint/no-unsafe-assignment
@wallie/realtime:lint:   193:17  warning  Unsafe member access .connection on an `error` typed value                                             @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:   200:9   warning  Unsafe assignment of an error typed value                                                              @typescript-eslint/no-unsafe-assignment
@wallie/realtime:lint:   206:3   warning  Unsafe call of a(n) `error` type typed value                                                           @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   206:10  warning  Unsafe member access .connection on an `error` typed value                                             @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:   208:16  warning  Unsafe return of a value of type error                                                                 @typescript-eslint/no-unsafe-return
@wallie/realtime:lint:   208:16  warning  Unsafe call of a(n) `error` type typed value                                                           @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   208:23  warning  Unsafe member access .connection on an `error` typed value                                             @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:
@wallie/realtime:lint: C:\_WALLIE\packages\realtime\src\pusher-server.ts
@wallie/realtime:lint:    53:21  warning  'Pusher' is an 'error' type that acts as 'any' and overrides all other types in this union type  @typescript-eslint/no-redundant-type-constituents
@wallie/realtime:lint:    87:5   warning  Unsafe assignment of an error typed value                                                        @typescript-eslint/no-unsafe-assignment
@wallie/realtime:lint:    87:22  warning  Unsafe construction of a(n) `error` type typed value                                             @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   108:9   warning  Unsafe assignment of an error typed value                                                        @typescript-eslint/no-unsafe-assignment
@wallie/realtime:lint:   111:9   warning  Unsafe call of a(n) `error` type typed value                                                     @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   111:16  warning  Unsafe member access .trigger on an `error` typed value                                          @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:   122:9   warning  Unsafe assignment of an error typed value                                                        @typescript-eslint/no-unsafe-assignment
@wallie/realtime:lint:   125:9   warning  Unsafe call of a(n) `error` type typed value                                                     @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   125:16  warning  Unsafe member access .trigger on an `error` typed value                                          @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:   132:9   warning  Unsafe assignment of an error typed value                                                        @typescript-eslint/no-unsafe-assignment
@wallie/realtime:lint:   136:9   warning  Unsafe call of a(n) `error` type typed value                                                     @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   136:16  warning  Unsafe member access .trigger on an `error` typed value                                          @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:   143:9   warning  Unsafe assignment of an error typed value                                                        @typescript-eslint/no-unsafe-assignment
@wallie/realtime:lint:   146:9   warning  Unsafe call of a(n) `error` type typed value                                                     @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   146:16  warning  Unsafe member access .trigger on an `error` typed value                                          @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:   156:9   warning  Unsafe assignment of an error typed value                                                        @typescript-eslint/no-unsafe-assignment
@wallie/realtime:lint:   159:9   warning  Unsafe call of a(n) `error` type typed value                                                     @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   159:16  warning  Unsafe member access .trigger on an `error` typed value                                          @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:   170:9   warning  Unsafe assignment of an error typed value                                                        @typescript-eslint/no-unsafe-assignment
@wallie/realtime:lint:   178:44  warning  Unsafe return of a value of type error                                                           @typescript-eslint/no-unsafe-return
@wallie/realtime:lint:   178:44  warning  Unsafe call of a(n) `error` type typed value                                                     @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   178:51  warning  Unsafe member access .trigger on an `error` typed value                                          @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:   194:9   warning  Unsafe assignment of an error typed value                                                        @typescript-eslint/no-unsafe-assignment
@wallie/realtime:lint:   198:12  warning  Unsafe call of a(n) `error` type typed value                                                     @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   198:19  warning  Unsafe member access .authorizeChannel on an `error` typed value                                 @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:   207:10  warning  Unsafe call of a(n) `error` type typed value                                                     @typescript-eslint/no-unsafe-call
@wallie/realtime:lint:   207:17  warning  Unsafe member access .authorizeChannel on an `error` typed value                                 @typescript-eslint/no-unsafe-member-access
@wallie/realtime:lint:
@wallie/realtime:lint: ✖ 87 problems (0 errors, 87 warnings)
@wallie/realtime:lint:
@wallie/ai:lint:
@wallie/ai:lint: > @wallie/ai@0.0.1 lint C:\_WALLIE\packages\ai
@wallie/ai:lint: > eslint src/
@wallie/ai:lint:
@wallie/web:lint:
@wallie/web:lint: > @wallie/web@0.0.1 lint C:\_WALLIE\apps\web
@wallie/web:lint: > next lint
@wallie/web:lint:
@wallie/ai:lint:
@wallie/ai:lint: C:\_WALLIE\packages\ai\src\__tests__\ai-cache.test.ts
@wallie/ai:lint:   165:56  warning  Async arrow function 'setCachedWithError' has no 'await' expression    @typescript-eslint/require-await
@wallie/ai:lint:   181:43  warning  Async arrow function 'getCacheStatsNoRedis' has no 'await' expression  @typescript-eslint/require-await
@wallie/ai:lint:
@wallie/ai:lint: C:\_WALLIE\packages\ai\src\__tests__\litellm.test.ts
@wallie/ai:lint:   389:7   warning  Async method 'generate' has no 'await' expression                           @typescript-eslint/require-await
@wallie/ai:lint:   390:7   warning  Async method 'healthCheck' has no 'await' expression                        @typescript-eslint/require-await
@wallie/ai:lint:   403:34  warning  Async arrow function 'generateWithLiteLLM' has no 'await' expression        @typescript-eslint/require-await
@wallie/ai:lint:   416:82  warning  Async arrow function 'generateWithErrorHandling' has no 'await' expression  @typescript-eslint/require-await
@wallie/ai:lint:   432:5   warning  Async generator function 'mockStreamGenerator' has no 'await' expression    @typescript-eslint/require-await
@wallie/ai:lint:   455:5   warning  Async generator function 'processStream' has no 'await' expression          @typescript-eslint/require-await
@wallie/ai:lint:
@wallie/ai:lint: C:\_WALLIE\packages\ai\src\__tests__\observability.test.ts
@wallie/ai:lint:   177:22  warning  Async arrow function has no 'await' expression  @typescript-eslint/require-await
@wallie/ai:lint:   190:52  warning  Async arrow function has no 'await' expression  @typescript-eslint/require-await
@wallie/ai:lint:   278:18  warning  Async arrow function has no 'await' expression  @typescript-eslint/require-await
@wallie/ai:lint:   288:18  warning  Async arrow function has no 'await' expression  @typescript-eslint/require-await
@wallie/ai:lint:   299:18  warning  Async arrow function has no 'await' expression  @typescript-eslint/require-await
@wallie/ai:lint:   310:18  warning  Async arrow function has no 'await' expression  @typescript-eslint/require-await
@wallie/ai:lint:
@wallie/ai:lint: C:\_WALLIE\packages\ai\src\advanced-rag\graph-rag.ts
@wallie/ai:lint:   353:8  warning  Async function 'graphRAGSearch' has no 'await' expression  @typescript-eslint/require-await
@wallie/ai:lint:
@wallie/ai:lint: C:\_WALLIE\packages\ai\src\advanced-rag\modular-rag.ts
@wallie/ai:lint:   132:5  warning  Async method 'process' has no 'await' expression  @typescript-eslint/require-await
@wallie/ai:lint:   145:5  warning  Async method 'process' has no 'await' expression  @typescript-eslint/require-await
@wallie/ai:lint:   164:5  warning  Async method 'process' has no 'await' expression  @typescript-eslint/require-await
@wallie/ai:lint:   177:5  warning  Async method 'process' has no 'await' expression  @typescript-eslint/require-await
@wallie/ai:lint:
@wallie/ai:lint: C:\_WALLIE\packages\ai\src\cache\ai-cache.ts
@wallie/ai:lint:    44:1  warning  Async function 'trackHit' has no 'await' expression             @typescript-eslint/require-await
@wallie/ai:lint:    53:1  warning  Async function 'trackMiss' has no 'await' expression            @typescript-eslint/require-await
@wallie/ai:lint:   203:8  warning  Async function 'invalidateUserCache' has no 'await' expression  @typescript-eslint/require-await
@wallie/ai:lint:
@wallie/ai:lint: C:\_WALLIE\packages\ai\src\observability\tracing.ts
@wallie/ai:lint:    59:34  warning  'unknown' overrides all other types in this union type  @typescript-eslint/no-redundant-type-constituents
@wallie/ai:lint:   144:34  warning  'unknown' overrides all other types in this union type  @typescript-eslint/no-redundant-type-constituents
@wallie/ai:lint:
@wallie/ai:lint: C:\_WALLIE\packages\ai\src\tools\definitions.ts
@wallie/ai:lint:   393:46  warning  'ToolDefinition' is an 'error' type that acts as 'any' and overrides all other types in this union type  @typescript-eslint/no-redundant-type-constituents
@wallie/ai:lint:
@wallie/ai:lint: ✖ 25 problems (0 errors, 25 warnings)
@wallie/ai:lint:

• turbo 2.7.2

```
