// Client-side database functions for demo purposes
// In a real application, these would make API calls to the backend

export const getIndicatorsByCategory = (category: string) => {
  // Mock implementation - return empty array for now
  return []
}

export const getCurrentUser = () => {
  // This should be handled by authentication system
  return null
}

export const getArticlesByCategory = (category: string) => {
  // Mock implementation - return empty array for now
  return []
}

export const updateIndicatorData = (indicatorId: string, year: string, value: number) => {
  // Mock implementation
  console.log("Update indicator data:", indicatorId, year, value)
  return Promise.resolve(true)
}

export const createQuestion = async (question: any) => {
  try {
    const response = await fetch('/api/faqs/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail: question.email,
        userPhone: question.phone,
        userFullName: question.full_name,
        question: question.question,
      })
    })

    if (!response.ok) {
      throw new Error('Gagal mengirim pertanyaan')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error creating question:', error)
    throw error
  }
}

export const saveArticle = (article: any) => {
  // Mock implementation
  console.log("Save article:", article)
  return Promise.resolve({ id: Date.now().toString(), ...article })
}

export const updateArticle = async (id: string, article: any) => {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('Token tidak ditemukan')
    }

    const response = await fetch(`/api/articles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(article)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Gagal memperbarui artikel')
    }

    return data.data
  } catch (error) {
    console.error('Error updating article:', error)
    throw error
  }
}

export const deleteArticle = async (id: string) => {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('Token tidak ditemukan')
    }

    const response = await fetch(`/api/articles/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Gagal menghapus artikel')
    }

    return true
  } catch (error) {
    console.error('Error deleting article:', error)
    throw error
  }
}

export const getArticles = () => {
  // Mock implementation - return empty array for now
  return []
}

export const getAllArticles = async () => {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('Token tidak ditemukan')
    }

    const response = await fetch('/api/articles', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Gagal mengambil data artikel')
    }

    return data.data || []
  } catch (error) {
    console.error('Error fetching articles:', error)
    return []
  }
}

export const createArticle = async (article: any) => {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('Token tidak ditemukan')
    }

    const response = await fetch('/api/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(article)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Gagal membuat artikel')
    }

    return data.data
  } catch (error) {
    console.error('Error creating article:', error)
    throw error
  }
}

export const toggleArticlePublication = async (id: string, is_published: boolean) => {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('Token tidak ditemukan')
    }

    const response = await fetch(`/api/articles/${id}/publish`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ is_published })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Gagal mengubah status publikasi')
    }

    return data.data
  } catch (error) {
    console.error('Error toggling article publication:', error)
    throw error
  }
}

export const getArticleDetails = async (id: string) => {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('Token tidak ditemukan')
    }

    const response = await fetch(`/api/articles/${id}/details`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Gagal mengambil detail artikel')
    }

    return data.data
  } catch (error) {
    console.error('Error fetching article details:', error)
    throw error
  }
}

export const getAllFAQs = () => {
  // Mock implementation - return empty array for now
  return []
}

export const createFAQ = (faq: any) => {
  // Mock implementation
  console.log("Create FAQ:", faq)
  return Promise.resolve({ id: Date.now().toString(), ...faq })
}

export const updateFAQ = (id: string, faq: any) => {
  // Mock implementation
  console.log("Update FAQ:", id, faq)
  return Promise.resolve({ id, ...faq })
}

export const deleteFAQ = (id: string) => {
  // Mock implementation
  console.log("Delete FAQ:", id)
  return Promise.resolve(true)
}

export const getArticleById = (id: string) => {
  // Mock implementation
  return null
}

export const createComment = (comment: any) => {
  // Mock implementation
  console.log("Create comment:", comment)
  return Promise.resolve({ id: Date.now().toString(), ...comment })
}