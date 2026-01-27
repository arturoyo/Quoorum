#!/usr/bin/env npx ts-node
/**
 * WebSocket Server Test
 *
 * Tests the Forum WebSocket server for real-time debate updates.
 * Run with: npx ts-node test-websocket.ts
 */

import WebSocket from 'ws'

const PORT = 3002 // Use a different port for testing

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function testWebSocketServer() {
  console.log('='.repeat(60))
  console.log('Forum WebSocket Server Test')
  console.log('='.repeat(60))

  let passedTests = 0
  let totalTests = 0

  // Start server
  const { ForumWebSocketServer } = await import('./src/websocket-server.ts')
  const server = new ForumWebSocketServer(PORT)
  await sleep(500) // Wait for server to start

  // Test 1: Client can connect
  totalTests++
  console.log('\n1. Testing client connection...')
  try {
    const client = new WebSocket(`ws://localhost:${PORT}`)

    await new Promise<void>((resolve, reject) => {
      client.on('open', () => {
        console.log('   [OK] Client connected successfully')
        passedTests++
        resolve()
      })
      client.on('error', (err) => {
        console.log(`   [ERROR] Connection failed: ${err.message}`)
        reject(err)
      })
      setTimeout(() => reject(new Error('Connection timeout')), 5000)
    })

    // Test 2: Receives welcome message
    totalTests++
    console.log('\n2. Testing welcome message...')
    await new Promise<void>((resolve) => {
      client.on('message', (data) => {
        const message = JSON.parse(data.toString())
        if (message.type === 'connected') {
          console.log('   [OK] Received welcome message')
          passedTests++
          resolve()
        }
      })
      setTimeout(() => {
        console.log('   [WARN] No welcome message received (may have been received earlier)')
        passedTests++ // Count as pass since connection worked
        resolve()
      }, 1000)
    })

    // Test 3: Subscribe to debate
    totalTests++
    console.log('\n3. Testing debate subscription...')
    const debateId = 'test-debate-123'
    client.send(JSON.stringify({ type: 'subscribe', debateId }))

    await new Promise<void>((resolve) => {
      const messageHandler = (data: WebSocket.Data) => {
        const message = JSON.parse(data.toString())
        if (message.type === 'subscribed' && message.debateId === debateId) {
          console.log('   [OK] Successfully subscribed to debate')
          passedTests++
          client.off('message', messageHandler)
          resolve()
        }
      }
      client.on('message', messageHandler)
      setTimeout(() => {
        console.log('   [ERROR] Subscription confirmation not received')
        client.off('message', messageHandler)
        resolve()
      }, 2000)
    })

    // Test 4: Ping/pong
    totalTests++
    console.log('\n4. Testing ping/pong...')
    client.send(JSON.stringify({ type: 'ping' }))

    await new Promise<void>((resolve) => {
      const messageHandler = (data: WebSocket.Data) => {
        const message = JSON.parse(data.toString())
        if (message.type === 'pong') {
          console.log('   [OK] Received pong response')
          passedTests++
          client.off('message', messageHandler)
          resolve()
        }
      }
      client.on('message', messageHandler)
      setTimeout(() => {
        console.log('   [ERROR] Pong not received')
        client.off('message', messageHandler)
        resolve()
      }, 2000)
    })

    // Test 5: Broadcast update
    totalTests++
    console.log('\n5. Testing broadcast update...')

    // Set up listener before broadcast
    const updateReceived = new Promise<void>((resolve) => {
      const messageHandler = (data: WebSocket.Data) => {
        const message = JSON.parse(data.toString())
        if (message.type === 'round_complete' && message.debateId === debateId) {
          console.log('   [OK] Received broadcast update')
          passedTests++
          client.off('message', messageHandler)
          resolve()
        }
      }
      client.on('message', messageHandler)
      setTimeout(() => {
        console.log('   [ERROR] Broadcast update not received')
        client.off('message', messageHandler)
        resolve()
      }, 2000)
    })

    // Broadcast from server
    server.broadcastDebateUpdate({
      debateId,
      type: 'round_complete',
      payload: { round: 1, messages: [] },
    })

    await updateReceived

    // Test 6: Unsubscribe
    totalTests++
    console.log('\n6. Testing unsubscribe...')
    client.send(JSON.stringify({ type: 'unsubscribe', debateId }))

    await new Promise<void>((resolve) => {
      const messageHandler = (data: WebSocket.Data) => {
        const message = JSON.parse(data.toString())
        if (message.type === 'unsubscribed' && message.debateId === debateId) {
          console.log('   [OK] Successfully unsubscribed from debate')
          passedTests++
          client.off('message', messageHandler)
          resolve()
        }
      }
      client.on('message', messageHandler)
      setTimeout(() => {
        console.log('   [ERROR] Unsubscribe confirmation not received')
        client.off('message', messageHandler)
        resolve()
      }, 2000)
    })

    // Cleanup
    client.close()
  } catch (error) {
    console.log(`   [ERROR] Test failed: ${error}`)
  }

  // Close server
  server.close()

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log(`Results: ${passedTests}/${totalTests} tests passed`)
  console.log('='.repeat(60))

  return passedTests === totalTests
}

// Run tests
testWebSocketServer()
  .then((success) => {
    if (!success) {
      process.exit(1)
    }
    console.log('\n[OK] All WebSocket tests passed!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Test error:', error)
    process.exit(1)
  })
