// API Service - Unified Backend Integration
// Resolves to Render production backend when deployed, with VITE_API_URL override and localhost fallback for dev.

const getApiBaseUrl = () => {
  const envUrl = import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '')
  }
  // Local development fallback
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8000/api'
  }
  // Production Render deployment
  return 'https://medverify-mrp6.onrender.com/api'
}

const API_BASE_URL = getApiBaseUrl()

const BACKEND_UNREACHABLE_MSG =
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'MedVerify backend is currently unreachable. Please make sure the server is running on port 8000.'
    : 'MedVerify backend is spinning up or temporarily unreachable. Free Render instances sleep when inactive — please wait ~30 seconds and try again.'

// ============================================
// MOCK DATA (Fallback when backend is not available)
// ============================================

const mockHistoryData = [
  { id: 1, claim: "Vitamin C prevents all viral infections", verdict: "MISLEADING", date: "2026-08-18", sources: 6, status: "completed" },
  { id: 2, claim: "Green tea burns fat instantly", verdict: "FALSE", date: "2026-08-15", sources: 4, status: "completed" },
  { id: 3, claim: "Regular exercise reduces heart disease risk", verdict: "TRUE", date: "2026-08-12", sources: 8, status: "completed" },
  { id: 4, claim: "Eating garlic prevents cancer", verdict: "MISLEADING", date: "2026-08-10", sources: 5, status: "completed" },
  { id: 5, claim: "Drinking 8 glasses of water daily is mandatory", verdict: "FALSE", date: "2026-08-08", sources: 3, status: "completed" },
  { id: 6, claim: "Mediterranean diet improves heart health", verdict: "TRUE", date: "2026-08-05", sources: 7, status: "completed" }
]

// ============================================
// VERIFY CLAIM ENDPOINTS
// ============================================

export const verifyTextClaim = async (text) => {
  try {
    const response = await fetch(`${API_BASE_URL}/verify/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      if (data && (data.valid_input === false || data.success === false)) {
        return data
      }
      throw new Error(data?.message || `HTTP error! status: ${response.status}`)
    }
    return data
  } catch (error) {
    console.error('API error:', error)
    return {
      success: false,
      valid_input: false,
      error_code: 'SERVER_UNAVAILABLE',
      message: BACKEND_UNREACHABLE_MSG
    }
  }
}

export const verifyUrlClaim = async (url) => {
  try {
    const response = await fetch(`${API_BASE_URL}/verify/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      if (data && (data.valid_input === false || data.success === false)) {
        return data
      }
      throw new Error(data?.message || `HTTP error! status: ${response.status}`)
    }
    return data
  } catch (error) {
    console.error('API error:', error)
    return {
      success: false,
      valid_input: false,
      error_code: 'SERVER_UNAVAILABLE',
      message: BACKEND_UNREACHABLE_MSG
    }
  }
}

export const verifyImageClaim = async (imageFile) => {
  try {
    const formData = new FormData()
    formData.append('image', imageFile)
    const response = await fetch(`${API_BASE_URL}/verify/image`, { method: 'POST', body: formData })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      if (data && (data.valid_input === false || data.success === false)) {
        return data
      }
      throw new Error(data?.message || `HTTP error! status: ${response.status}`)
    }
    return data
  } catch (error) {
    console.error('API error:', error)
    return {
      success: false,
      valid_input: false,
      error_code: 'SERVER_UNAVAILABLE',
      message: BACKEND_UNREACHABLE_MSG
    }
  }
}

// ============================================
// HISTORY ENDPOINTS
// ============================================

export const getVerificationHistory = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/history`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error('Backend not available, using mock history:', error)
    return mockHistoryData
  }
}

export const getVerificationById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/history/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error('Backend not available, using mock data:', error)
    const item = mockHistoryData.find(item => item.id === parseInt(id))
    return item || mockHistoryData[0]
  }
}

export const deleteVerificationById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/history/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || `HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error deleting verification record:', error)
    // If backend is unreachable, handle mock list as fallback
    const idx = mockHistoryData.findIndex(item => item.id === parseInt(id))
    if (idx !== -1) {
      mockHistoryData.splice(idx, 1)
      return { success: true, message: `Mock claim #${id} deleted.` }
    }
    throw error
  }
}

// ============================================
// ANALYTICS ENDPOINTS
// ============================================

export const getAnalytics = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error('Backend not available, using mock analytics:', error)
    return {
      verdictData: [
        { name: 'True', value: 35 },
        { name: 'False', value: 25 },
        { name: 'Misleading', value: 40 }
      ],
      activityData: [
        { month: 'Jan', claims: 12 }, { month: 'Feb', claims: 18 },
        { month: 'Mar', claims: 15 }, { month: 'Apr', claims: 22 },
        { month: 'May', claims: 28 }, { month: 'Jun', claims: 30 },
        { month: 'Jul', claims: 45 }, { month: 'Aug', claims: 52 }
      ],
      sourceData: [
        { name: 'PubMed', value: 45 }, { name: 'WHO', value: 28 },
        { name: 'ICMR', value: 18 }, { name: 'Other', value: 9 }
      ],
      categoryData: [
        { name: 'Nutrition', value: 30 }, { name: 'Diseases', value: 25 },
        { name: 'Medication', value: 20 }, { name: 'Lifestyle', value: 15 },
        { name: 'Preventive', value: 10 }
      ],
      timelineData: [
        { year: '2022', True: 5, False: 8, Misleading: 7 },
        { year: '2023', True: 12, False: 10, Misleading: 15 },
        { year: '2024', True: 18, False: 15, Misleading: 22 },
        { year: '2025', True: 25, False: 20, Misleading: 30 },
        { year: '2026', True: 35, False: 25, Misleading: 40 }
      ],
      summary: { total: 245, truePercent: 35, falsePercent: 25, misleadingPercent: 40 }
    }
  }
}

// ============================================
// HEALTH CHECK
// ============================================

export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' })
    return response.ok
  } catch (error) {
    console.error('Backend not available:', error)
    return false
  }
}

// ============================================
// 🚨 CHATBOT — EMERGENCY-AWARE & SMARTER
// ============================================

// ---------- 1. EMERGENCY DETECTION ----------
const EMERGENCY_KEYWORDS = [
  'chest pain', 'heart attack', 'cardiac arrest',
  "can't breathe", 'cant breathe', 'cannot breathe',
  'difficulty breathing', 'choking', 'suffocating', 'short of breath',
  'severe bleeding', 'heavy bleeding', 'blood loss', 'bleeding heavily',
  'unconscious', 'fainted', 'passed out', 'unresponsive',
  'not breathing', 'collapsed',
  'stroke', 'face drooping', 'slurred speech', 'weakness on one side',
  'suicide', 'kill myself', 'end my life', 'self harm', 'self-harm',
  'want to die', 'hurt myself',
  'overdose', 'poisoned', 'swallowed pills', 'took too many pills',
  'seizure', 'convulsion', 'having fits',
  'severe burn', 'third degree burn',
  'anaphylaxis', 'severe allergic reaction', 'throat swelling',
  'severe head injury', 'severe injury',
  'snake bite', 'dog bite'
]

const EMERGENCY_ROOTS = [
  'bleed', 'choke', 'faint', 'collaps', 'seizur',
  'suicid', 'overdos', 'poison', 'stroke', 'burn'
]

const normalize = (msg) =>
  msg.toLowerCase().replace(/[^\w\s']/g, ' ').replace(/\s+/g, ' ').trim()

const isEmergency = (msg) => {
  const m = normalize(msg)
  if (EMERGENCY_KEYWORDS.some(trigger => m.includes(trigger))) return true
  const words = m.split(' ')
  return words.some(w => EMERGENCY_ROOTS.some(root => w.startsWith(root)))
}

// Export for potential reuse
export const checkEmergency = isEmergency

const emergencyReply = () =>
  `🚨 EMERGENCY DETECTED — Please act immediately.\n\n` +
  `📞 Call emergency services NOW:\n` +
  `• India: 108 (ambulance) or 112 (all emergencies)\n` +
  `• Suicide & Crisis Helpline (India): 9152987821\n` +
  `• Women Helpline: 181 · Child Helpline: 1098\n` +
  `• International: 911 (US) · 999 (UK) · 112 (EU)\n\n` +
  `🩺 While waiting:\n` +
  `• Keep the person calm and still.\n` +
  `• Do not give food or water if unconscious.\n` +
  `• If trained, begin CPR for no pulse / no breathing.\n` +
  `• Press hard on any bleeding wound with a clean cloth.\n\n` +
  `⚠️ I am an AI verification tool, not a doctor. I cannot diagnose or treat. ` +
  `Please contact a real medical professional immediately.`

// ---------- 2. KNOWLEDGE BASE ----------
const KNOWLEDGE_BASE = [
  // Emergency-adjacent health topics
  { keys: ['fever', 'temperature'], reply: "A fever above 39°C (102°F) in adults or 38°C (100.4°F) in children lasting more than 2–3 days needs a doctor. Stay hydrated, rest, and use paracetamol as directed. If fever is with rash, stiff neck, confusion, or trouble breathing — go to hospital immediately." },
  { keys: ['dehydration'], reply: "Signs: dry mouth, dark urine, dizziness, no tears. Drink ORS (oral rehydration salts) or water with a pinch of salt and sugar. Seek help if you can't keep fluids down or feel faint." },
  { keys: ['burn', 'scald'], reply: "For minor burns: cool under running water for 20 minutes, cover loosely, do NOT apply ice, butter, or toothpaste. For large, deep, or blistering burns — go to hospital." },
  { keys: ['fracture', 'broken bone'], reply: "Do not try to straighten the limb. Immobilize with a splint, apply ice wrapped in cloth, and go to an emergency room. Call 108 if the bone is visible." },
  { keys: ['snake bite'], reply: "Keep the person still and calm. Do NOT cut, suck, or apply a tourniquet. Immobilize the limb below heart level and get to a hospital with antivenom ASAP." },
  { keys: ['dog bite', 'animal bite'], reply: "Wash the wound with soap and running water for 15 minutes. Go to a hospital immediately for rabies and tetanus shots — do not wait for symptoms." },

  // Common medical myths
  { keys: ['lemon', 'diabetes'], reply: "Evidence from PubMed and WHO does NOT support lemon water as a cure for diabetes. Hydration helps, but diabetes needs medical management, diet, and prescribed medication." },
  { keys: ['vitamin c', 'cold', 'flu'], reply: "Vitamin C does not prevent the common cold in the general population. It may slightly shorten duration if taken regularly. Source: Cochrane reviews." },
  { keys: ['vaccine', 'vaccination'], reply: "Vaccines are among the most studied medical interventions. Multiple large studies show no link between vaccines and autism. Follow your country's immunization schedule (ICMR / WHO)." },
  { keys: ['autism'], reply: "Autism is a neurodevelopmental condition with genetic and environmental factors. It is NOT caused by vaccines. Early support and therapy improve outcomes." },
  { keys: ['turmeric', 'curcumin'], reply: "Turmeric has mild anti-inflammatory properties in lab studies, but there is no reliable clinical evidence that it cures cancer or major diseases. Consult a doctor before using it as treatment." },
  { keys: ['garlic'], reply: "Garlic has some antimicrobial properties in lab studies. Evidence that it prevents cancer or infections in humans is weak. It can interact with blood thinners." },
  { keys: ['green tea', 'fat burn'], reply: "Green tea may slightly boost metabolism, but it does NOT 'burn fat instantly.' Sustainable weight loss requires diet and exercise." },
  { keys: ['8 glasses', 'water intake', 'drink water'], reply: "The '8 glasses a day' rule is a myth. Water needs vary by person, activity, and climate. Thirst and pale-yellow urine are better guides." },
  { keys: ['alkaline', 'ph water'], reply: "Alkaline water has no proven health benefits over normal water. Your body tightly regulates blood pH — food and water cannot change it." },
  { keys: ['detox', 'cleanse'], reply: "Your liver and kidneys already detoxify your body. 'Detox teas' and cleanses have no proven benefit and some can be harmful." },
  { keys: ['homeopathy'], reply: "Systematic reviews (including Australia's NHMRC) find no reliable evidence that homeopathy works beyond placebo. Consult a qualified doctor for real treatment." },
  { keys: ['cancer cure'], reply: "There is no single 'cure for cancer.' Treatment depends on type, stage, and patient. Beware of any claim of a universal cancer cure — it is almost always misleading." },
  { keys: ['antibiotic', 'antibiotics'], reply: "Antibiotics only work on bacterial infections — not viruses like cold or flu. Always complete the prescribed course. Misuse leads to antibiotic resistance." },
  { keys: ['covid', 'corona'], reply: "For current COVID-19 guidance, follow WHO and your national health authority (ICMR in India). Vaccination, ventilation, and hand hygiene remain effective." },

  // Nutrition / lifestyle
  { keys: ['protein', 'muscle'], reply: "Adults generally need 0.8–1.2 g of protein per kg body weight daily, more if active. Sources: dal, paneer, eggs, chicken, fish, soy, nuts." },
  { keys: ['keto', 'ketogenic'], reply: "Keto can help short-term weight loss but is not for everyone. Consult a doctor if you have kidney, liver, or heart conditions." },
  { keys: ['intermittent fasting'], reply: "Intermittent fasting may aid weight loss for some people, but doesn't suit everyone (e.g., pregnant women, diabetics on insulin). Talk to a doctor first." },
  { keys: ['sleep'], reply: "Adults need 7–9 hours of sleep. Consistent schedule, no screens 1 hour before bed, and a cool dark room help. Persistent insomnia → see a doctor." },
  { keys: ['stress', 'anxiety'], reply: "Try box breathing (4-4-4-4), regular exercise, and limiting caffeine. If anxiety affects daily life for weeks, see a mental-health professional." },
  { keys: ['mental health', 'depression'], reply: "Depression is a real, treatable medical condition. Therapy and/or medication work. If you have thoughts of self-harm, call the Suicide & Crisis Helpline (India): 9152987821." },

  // Basics
  { keys: ['paracetamol', 'acetaminophen'], reply: "Paracetamol dose for adults: 500–1000 mg every 4–6 hours, max 4 g/day. Overdose is dangerous — go to a hospital immediately if you suspect one." },
  { keys: ['ibuprofen'], reply: "Ibuprofen: 200–400 mg every 4–6 hours with food, max 1200 mg/day OTC. Avoid with ulcers, kidney disease, or in late pregnancy." },
  { keys: ['blood pressure', 'hypertension'], reply: "Normal BP is around 120/80 mmHg. Above 140/90 consistently = hypertension. Lifestyle changes + medication if prescribed. Get checked regularly." },
  { keys: ['sugar', 'blood sugar'], reply: "Fasting blood sugar 70–100 mg/dL is normal. 100–125 = prediabetes. 126+ = diabetes (confirmed twice). Get an HbA1c test for a 3-month picture." },
  { keys: ['pregnancy'], reply: "For any pregnancy-related question — especially pain, bleeding, reduced fetal movement, or swelling — contact your gynecologist or go to the nearest hospital immediately." },
  { keys: ['child', 'baby', 'infant'], reply: "For children under 5, always consult a pediatrician before giving any medicine. Warning signs: high fever, refusing feeds, lethargy, breathing difficulty — go to hospital." }
]

const findKnowledgeReply = (msg) => {
  const m = normalize(msg)
  const sorted = [...KNOWLEDGE_BASE].sort((a, b) => {
    const aMax = Math.max(...a.keys.map(k => k.split(' ').length))
    const bMax = Math.max(...b.keys.map(k => k.split(' ').length))
    return bMax - aMax
  })
  for (const entry of sorted) {
    if (entry.keys.some(key => m.includes(key))) return entry.reply
  }
  return null
}

// ---------- 3. SAFE GENERIC FALLBACK ----------
const genericFallback = (question) => {
  const shortQ = question.length > 60 ? question.slice(0, 60) + '…' : question
  return (
    `I don't have a specific verified answer for "${shortQ}" yet.\n\n` +
    `Here's what I recommend:\n` +
    `• Check trusted sources: PubMed, WHO, ICMR, or the NHS website.\n` +
    `• Be sceptical of viral social-media health tips.\n` +
    `• For personal medical concerns, consult a qualified doctor.\n\n` +
    `⚠️ If this is an emergency (chest pain, breathing trouble, severe bleeding, or thoughts of self-harm), call 108 or 112 in India right now.`
  )
}

// ---------- 4. LOCAL REPLY ----------
const localBotReply = (question) => {
  if (isEmergency(question)) return emergencyReply()
  const known = findKnowledgeReply(question)
  if (known) return known
  return genericFallback(question)
}

// ---------- 5. PUBLIC ASK FUNCTION ----------
export const askChatbot = async (message) => {
  // Client-side emergency check — instant reply, skip network
  if (isEmergency(message)) {
    await new Promise(r => setTimeout(r, 200))
    return emergencyReply()
  }

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })
    if (!response.ok) throw new Error('Backend chat unavailable')
    const data = await response.json()
    return data.reply || data.message || localBotReply(message)
  } catch (error) {
    console.warn('Chatbot backend unavailable, using local reply.')
    await new Promise(r => setTimeout(r, 500))
    return localBotReply(message)
  }
}

// ---------- 6. SUGGESTION CHIPS (for Chatbot.jsx) ----------
export const getChatbotSuggestions = () => [
  'Is drinking lemon water a cure for diabetes?',
  'Does vitamin C prevent colds?',
  'Are vaccines linked to autism?',
  'Does turmeric cure cancer?',
]