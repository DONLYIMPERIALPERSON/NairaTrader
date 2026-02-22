import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MobileSupportHeader from '../components/MobileSupportHeader'
import { supportService } from '../lib/support'
import '../styles/Home.css'

interface Message {
  id: string
  message: string
  sender: 'user' | 'support'
  created_at: string
  image_url?: string
  is_read?: boolean
}

interface Chat {
  id: string
  subject: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  last_message: string
  unread_count: number
}

const MobileSupportPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>()
  const navigate = useNavigate()
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showImageOptions, setShowImageOptions] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadChats()
  }, [])

  useEffect(() => {
    if (chatId) {
      loadSpecificChat(chatId)
    } else {
      // If no chatId in URL, redirect to previous chats page
      navigate('/support')
    }
  }, [chatId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChats = async () => {
    try {
      const chatData = await supportService.getChats()
      setChats(chatData)
    } catch (error) {
      console.error('Failed to load chats:', error)
    }
  }

  const loadSpecificChat = async (id: string) => {
    try {
      const chatData = await supportService.getChat(id)
      setCurrentChat(chatData)
      setMessages(chatData.messages || [])
      // Mark as read
      await supportService.markChatAsRead(id)
      // Update unread count in chats list
      setChats(prev => prev.map(chat =>
        chat.id === id ? { ...chat, unread_count: 0 } : chat
      ))
    } catch (error) {
      console.error('Failed to load chat:', error)
      // If chat not found, redirect to previous chats
      navigate('/support')
    }
  }



  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedImage) return
    if (!currentChat) return

    setIsLoading(true)
    try {
      let result
      if (selectedImage) {
        result = await supportService.sendMessageWithImage(currentChat.id, newMessage, selectedImage)
      } else {
        result = await supportService.sendMessage(currentChat.id, newMessage)
      }

      // Add the new message to the messages list
      setMessages(prev => [...prev, result])
      setNewMessage('')
      setSelectedImage(null)
      setImagePreview(null)
      setShowImageOptions(false)

      // Update chat's last message and timestamp
      setChats(prev => prev.map(chat =>
        chat.id === currentChat.id
          ? { ...chat, last_message: result.message, updated_at: result.created_at }
          : chat
      ))
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.')
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB.')
        return
      }

      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setShowImageOptions(false)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const renderMessage = (message: Message) => {
    const isUser = message.sender === 'user'
    const bgColor = isUser ? 'rgba(255,215,0,0.8)' : 'rgba(255,215,0,0.1)'
    const textColor = isUser ? 'black' : 'white'
    const borderRadius = isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px'
    const justifyContent = isUser ? 'flex-end' : 'flex-start'

    return (
      <div key={message.id} style={{display: 'flex', justifyContent, marginBottom: '16px'}}>
        <div style={{
          background: bgColor,
          borderRadius,
          padding: '12px 16px',
          maxWidth: '280px',
          border: isUser ? 'none' : '0.5px solid rgba(255,215,0,0.2)',
          wordWrap: 'break-word'
        }}>
          {message.image_url && (
            <div style={{marginBottom: '8px'}}>
              <img
                src={message.image_url}
                alt="Uploaded"
                style={{
                  maxWidth: '100%',
                  maxHeight: '200px',
                  borderRadius: '8px',
                  objectFit: 'cover'
                }}
              />
            </div>
          )}
          <div style={{fontSize: '14px', color: textColor, lineHeight: '1.4'}}>
            {message.message}
          </div>
          <div style={{
            fontSize: '12px',
            color: isUser ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.5)',
            marginTop: '4px'
          }}>
            {formatTime(message.created_at)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{backgroundColor: '#000000', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '0 12px 16px', minHeight: '100vh', color: 'white', lineHeight: '1.4', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale'}}>
      <div style={{position: 'fixed', top: '0', left: '0', right: '0', zIndex: '10', background: '#000000', padding: '20px 12px 0'}}>
        <MobileSupportHeader />
      </div>

      <div style={{maxWidth: '400px', width: '100%', margin: '0 auto', paddingTop: '100px'}}>
        <div style={{height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column'}}>
          <div style={{flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 20px'}}>

            <div style={{flex: 1, overflowY: 'auto', paddingBottom: '120px'}}>
              {messages.length === 0 ? (
                <div style={{textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '40px 20px'}}>
                  <div style={{fontSize: '16px', marginBottom: '8px'}}>Welcome to Support</div>
                  <div style={{fontSize: '14px'}}>How can we help you with your trading account today?</div>
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column'}}>
                  {messages.map(renderMessage)}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {imagePreview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#000',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '90%',
            maxHeight: '90%'
          }}>
            <img
              src={imagePreview}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                borderRadius: '8px',
                objectFit: 'contain'
              }}
            />
            <div style={{display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'center'}}>
              <button
                onClick={removeImage}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
              <button
                onClick={() => setImagePreview(null)}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={isLoading}
                style={{
                  background: isLoading ? 'rgba(255,215,0,0.5)' : 'rgba(255,215,0,0.8)',
                  color: 'black',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '600'
                }}
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Options Modal */}
      {showImageOptions && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '20px',
          right: '20px',
          background: '#1a1a1a',
          borderRadius: '12px',
          padding: '20px',
          zIndex: 1000,
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <div style={{textAlign: 'center', marginBottom: '15px'}}>
            <div style={{fontSize: '16px', fontWeight: 'bold', marginBottom: '5px'}}>Add Image</div>
            <div style={{fontSize: '14px', color: 'rgba(255,255,255,0.7)'}}>
              Choose an image to attach to your message
            </div>
          </div>
          <div style={{display: 'flex', gap: '10px'}}>
            <button
              onClick={() => {
                fileInputRef.current?.click()
                setShowImageOptions(false)
              }}
              style={{
                flex: 1,
                background: '#FFD700',
                color: 'black',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Choose from Gallery
            </button>
            <button
              onClick={() => setShowImageOptions(false)}
              style={{
                background: '#333',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 20px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {currentChat?.status !== 'closed' && (
        <div style={{position: 'fixed', bottom: '0', left: '0', right: '0', background: '#000000', padding: '16px 20px', borderTop: '0.5px solid rgba(255,255,255,0.1)'}}>
          <div style={{maxWidth: '400px', width: '100%', margin: '0 auto'}}>
            {/* Image Preview in Input Area */}
            {imagePreview && (
              <div style={{marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <img
                  src={imagePreview}
                  alt="Selected"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '6px',
                    objectFit: 'cover'
                  }}
                />
                <span style={{fontSize: '12px', color: 'rgba(255,255,255,0.7)'}}>
                  Image selected
                </span>
                <button
                  onClick={removeImage}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc3545',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
              <div
                style={{
                  background: 'rgba(255,215,0,0.1)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => setShowImageOptions(true)}
              >
                <i className="fas fa-plus" style={{color: '#FFD700', fontSize: '16px'}}></i>
              </div>
              <div style={{flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '12px 16px', border: '0.5px solid rgba(255,255,255,0.1)'}}>
                <input
                  type="text"
                  placeholder="Enter your question..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                  style={{width: '100%', background: 'transparent', border: 'none', color: 'white', fontSize: '16px', outline: 'none'}}
                  disabled={isLoading}
                />
              </div>
              <div
                style={{
                  background: isLoading ? 'rgba(255,215,0,0.5)' : 'rgba(255,215,0,0.8)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
                onClick={!isLoading ? handleSendMessage : undefined}
              >
                {isLoading ? (
                  <i className="fas fa-spinner fa-spin" style={{color: 'black', fontSize: '14px'}}></i>
                ) : (
                  <i className="fas fa-paper-plane" style={{color: 'black', fontSize: '14px'}}></i>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        style={{display: 'none'}}
      />
    </div>
  )
}

export default MobileSupportPage
