// Test script para verificar comentarios
// Ejecutar en la consola del navegador en la página de debates

async function testComments() {
  // 1. Obtener un debate ID de la URL
  const debateId = window.location.pathname.split('/').pop()
  console.log('Testing with debate ID:', debateId)

  // 2. Intentar obtener comentarios
  try {
    const response = await fetch('/api/trpc/quoorum.getComments?input=' + encodeURIComponent(JSON.stringify({ debateId })))
    const data = await response.json()
    console.log('Current comments:', data)
  } catch (error) {
    console.error('Error getting comments:', error)
  }

  // 3. Intentar añadir un comentario
  try {
    const response = await fetch('/api/trpc/quoorum.addComment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        debateId,
        content: 'Test comment from console - ' + new Date().toISOString(),
      })
    })
    const data = await response.json()
    console.log('Add comment result:', data)
  } catch (error) {
    console.error('Error adding comment:', error)
  }
}

// Run test
testComments()
