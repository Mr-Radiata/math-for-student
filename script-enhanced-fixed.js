// Production API Configuration
const API_BASE = 'https://api.techdilnoza.uz/api'

// API Connection Status for Frontend
let FRONTEND_API_STATUS = {
	main: 'unknown',
	usingDemo: false,
	lastChecked: null,
}

// Demo data for offline mode (shown only if the live API cannot be reached).
// Kept topically consistent with the platform: algebra & geometry materials.
const DEMO_MATERIALS = [
	{
		_id: 'demo1',
		section: 'lectures',
		title: 'Kvadrat tenglamalar. Nazariy asoslar',
		description:
			"Kvadrat tenglamalarni yechish usullari, diskriminant va Vieta teoremasi bo'yicha ma'ruza matni.",
		imageUrl: '',
		fileUrl: '#demo-file',
		fileName: 'kvadrat-tenglamalar.pdf',
		createdAt: '2024-11-17T10:00:00Z',
	},
	{
		_id: 'demo2',
		section: 'practicals',
		title: 'Uchburchaklarga oid amaliy masalalar',
		description:
			"Uchburchak yuzasi, perimetri va burchaklariga oid masalalarni yechish bo'yicha amaliy mashg'ulot.",
		imageUrl: '',
		fileUrl: '#demo-file',
		fileName: 'uchburchak-masalalari.docx',
		createdAt: '2024-11-16T14:30:00Z',
	},
	{
		_id: 'demo3',
		section: 'presentations',
		title: "Funksiya va uning grafigi",
		description:
			"Chiziqli va kvadratik funksiyalar grafiklarini yasash bo'yicha taqdimot.",
		imageUrl: '',
		fileUrl: '#demo-file',
		fileName: 'funksiya-grafigi.pptx',
		createdAt: '2024-11-15T09:15:00Z',
	},
]

const DEMO_NEWS = [
	{
		_id: 'news1',
		title: "Yangi dars materiallari qo'shildi",
		content:
			"Algebra va geometriya bo'yicha yangi ma'ruza va amaliy mashg'ulot materiallari qo'shildi. Barcha o'quvchilar uchun bepul.",
		author: "Dilnoza Jo'rayeva",
		date: '2024-11-17T08:00:00Z',
		createdAt: '2024-11-17T08:00:00Z',
	},
	{
		_id: 'news2',
		title: 'Milliy sertifikat tayyorgarligi bo\'yicha materiallar',
		content:
			"Milliy sertifikat va DTM imtihonlariga tayyorgarlik ko'rish uchun qo'shimcha qo'llanmalar tayyorlanmoqda.",
		author: "Dilnoza Jo'rayeva",
		date: '2024-11-16T12:00:00Z',
		createdAt: '2024-11-16T12:00:00Z',
	},
]

// Fetch helper: try the live API, fall back to bundled demo data for GET
// requests only (so the page is never empty if the backend is unreachable).
async function fetchWithFallback(endpoint, options = {}) {
	try {
		debugLog(`🔗 Requesting: ${API_BASE}${endpoint}`)
		const response = await fetch(`${API_BASE}${endpoint}`, options)
		if (response.ok) {
			return response
		}
		throw new Error(`API failed: ${response.status} ${response.statusText}`)
	} catch (error) {
		debugLog(`❌ API request failed: ${error.message}`)

		if (options.method === 'GET' || !options.method) {
			debugLog(`🎭 Using offline demo data for: ${endpoint}`)
			return createDemoResponse(endpoint)
		}

		throw error
	}
}

// Create mock response for demo data
function createDemoResponse(endpoint) {
	let data = null

	if (endpoint === '/materials') {
		data = DEMO_MATERIALS
	} else if (endpoint === '/news') {
		data = DEMO_NEWS
	} else if (endpoint === '/health') {
		data = {
			status: 'DEMO MODE',
			message: 'Using offline demo data',
			timestamp: new Date().toISOString(),
		}
	} else {
		throw new Error('No demo data available for this endpoint')
	}

	return Promise.resolve({
		ok: true,
		status: 200,
		json: () => Promise.resolve(data),
		text: () => Promise.resolve(JSON.stringify(data)),
	})
}

// Test API connectivity for frontend
async function testFrontendAPIConnectivity() {
	try {
		const response = await fetch(`${API_BASE}/health`, {
			method: 'GET',
			mode: 'cors',
			credentials: 'omit',
			headers: { Accept: 'application/json' },
		})

		if (response.ok) {
			FRONTEND_API_STATUS.main = 'online'
			FRONTEND_API_STATUS.usingDemo = false
			debugLog('✅ API is online')
		} else {
			throw new Error(`Status: ${response.status}`)
		}
	} catch (error) {
		FRONTEND_API_STATUS.main = 'offline'
		FRONTEND_API_STATUS.usingDemo = true
		debugLog('❌ API offline, demo data will be used:', error.message)
	}

	FRONTEND_API_STATUS.lastChecked = new Date().toISOString()
}

async function testAPIConnectivity() {
	try {
		return await testFrontendAPIConnectivity()
	} catch (e) {
		console.warn('⚠️ testAPIConnectivity error:', e && e.message)
		return false
	}
}

// Debug function
function debugLog(message, data = null) {
	console.log(`🔍 [DEBUG] ${message}`, data || '')
}

// Materials yuklab olish
async function loadMaterials() {
	try {
		debugLog('Fetching materials...')

		const res = await fetchWithFallback('/materials', {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
			mode: 'cors',
			credentials: 'omit',
		})

		if (!res.ok) {
			throw new Error(`Materials API failed: ${res.status} ${res.statusText}`)
		}

		const materials = await res.json()
		const container = document.getElementById('cardsContainer')
		if (!container) return

		container.innerHTML = ''

		if (materials.length === 0) {
			container.innerHTML = `
                <div class="no-data">
                    <h3>🔍 Materiallar topilmadi</h3>
                    <p>Hozircha hech qanday material qo'shilmagan.</p>
                </div>
            `
			return
		}

		allMaterials = materials
		window.allMaterials = materials

		materials.forEach(item => container.appendChild(renderMaterialCard(item)))

		updateMaterialsStats(materials)
		debugLog(`✅ ${materials.length} materials rendered`)
	} catch (error) {
		debugLog('ERROR in loadMaterials:', error.message)

		const container = document.getElementById('cardsContainer')
		if (container) {
			container.innerHTML = `
                <div class="error-message">
                    <h3>⚠️ Materiallarni yuklashda xatolik</h3>
                    <p><strong>Xatolik:</strong> ${error.message}</p>
                    <button onclick="loadMaterials()" class="btn btn-dark">🔄 Qayta yuklash</button>
                </div>
            `
		}
	}
}

// Build a single material card element (shared by loadMaterials & filterMaterials)
function renderMaterialCard(item) {
	let imageUrl = null
	if (item.imageUrl && !item.imageUrl.includes('placeholder') && !item.imageUrl.includes('example.com')) {
		imageUrl = item.imageUrl
	} else if (item.imageKey) {
		imageUrl = `https://s3.twcstorage.ru/e008923b-dbcf87a4-7047-45d8-8a51-89a9793149a6/${item.imageKey}`
	}

	const card = document.createElement('div')
	card.className = 'card'

	let imageSection = ''
	if (imageUrl) {
		imageSection = `
			<div class="card-image">
				<img src="${imageUrl}" alt="${item.title || 'Material'}" loading="lazy"
					onerror="this.parentElement.outerHTML = '<div class=\\'no-image-placeholder\\'>📚<small>Rasm yuklanmadi</small></div>'">
			</div>`
	} else {
		imageSection = `
			<div class="no-image-placeholder">
				📚
				<small>Rasm qo'shilmagan</small>
			</div>`
	}

	card.innerHTML = `
		${imageSection}
		<div class="card-content">
			<div class="title"><h3>${item.title || 'Material'}</h3></div>
			<div class="desc">${item.description || item.desc || "Tavsif yo'q"}</div>
			<div class="card-meta">
				<span class="section-badge">${getSectionName(item.section)}</span>
				<span class="date">${formatDate(item.createdAt)}</span>
			</div>
			<div class="card-actions">
				${
					item.fileKey || item.fileUrl
						? `<button class="btn-download" onclick="downloadMaterial('${item._id || 'unknown'}', '${(item.title || '').replace(/'/g, "\\'")}', '${item.fileName || 'file'}')">📥 Yuklab olish</button>`
						: '<button class="btn-disabled" disabled>📎 Fayl yuklanmagan</button>'
				}
			</div>
		</div>
	`
	return card
}

// News yuklab olish
async function loadNews() {
	try {
		const res = await fetchWithFallback('/news', { method: 'GET', mode: 'cors', credentials: 'omit' })
		if (!res.ok) throw new Error(`News API failed: ${res.status} ${res.statusText}`)

		const news = await res.json()
		const container = document.getElementById('newsContainer')
		if (!container) return

		container.innerHTML = ''

		if (news.length === 0) {
			container.innerHTML = `
                <div class="no-data">
                    <h3>📰 Yangiliklar topilmadi</h3>
                    <p>Hozircha yangiliklar qo'shilmagan.</p>
                </div>
            `
			return
		}

		news.slice(0, 3).forEach(item => {
			const newsCard = document.createElement('div')
			newsCard.className = 'news-card'

			let date = "Noma'lum sana"
			try {
				const dateObj = new Date(item.date || item.createdAt || new Date())
				if (!isNaN(dateObj.getTime())) date = dateObj.toLocaleDateString('uz-UZ')
			} catch (e) {
				debugLog('Date parsing error:', e)
			}

			newsCard.innerHTML = `
                <div class="news-content">
                    <h4>${item.title || 'Yangilik sarlavhasi'}</h4>
                    <p>${item.content || "Yangilik matni yo'q"}</p>
                    <div class="news-meta">
                        <span class="date">📅 ${date}</span>
                        <span class="author">👤 ${item.author || "Dilnoza Jo'rayeva"}</span>
                    </div>
                </div>
            `
			container.appendChild(newsCard)
		})
	} catch (error) {
		debugLog('ERROR in loadNews:', error.message)
		const container = document.getElementById('newsContainer')
		if (container) {
			container.innerHTML = `
                <div class="error-message">
                    <h3>⚠️ Yangiliklar yuklanmadi</h3>
                    <p><strong>Xatolik:</strong> ${error.message}</p>
                    <button onclick="loadNews()" class="btn btn-dark">🔄 Qayta yuklash</button>
                </div>
            `
		}
	}
}

function setCurrentYear() {
	const yearElement = document.getElementById('year')
	if (yearElement) yearElement.textContent = new Date().getFullYear()
}

// ---------- Mobile nav ----------
function setupMobileNav() {
	const toggle = document.getElementById('navToggle')
	const nav = document.getElementById('mainNav')
	if (!toggle || !nav) return

	toggle.addEventListener('click', () => {
		const isOpen = nav.classList.toggle('is-open')
		toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false')
	})

	nav.querySelectorAll('a').forEach(link => {
		link.addEventListener('click', () => {
			nav.classList.remove('is-open')
			toggle.setAttribute('aria-expanded', 'false')
		})
	})
}

// ---------- Hero media carousel (fade), replaces the previous broken slider ----------
function setupMediaCarousel() {
	const track = document.getElementById('mediaTrack')
	if (!track) return

	const slides = Array.from(track.querySelectorAll('.media-slide'))
	const dotsWrap = document.getElementById('mediaDots')
	const prevBtn = document.getElementById('mediaPrev')
	const nextBtn = document.getElementById('mediaNext')
	if (slides.length === 0) return

	let index = 0
	let timer = null

	slides.forEach((_, i) => {
		const dot = document.createElement('button')
		dot.setAttribute('aria-label', `${i + 1}-rasm`)
		if (i === 0) dot.classList.add('is-active')
		dot.addEventListener('click', () => show(i))
		dotsWrap.appendChild(dot)
	})
	const dots = Array.from(dotsWrap.children)

	function show(newIndex) {
		slides[index].classList.remove('is-active')
		dots[index].classList.remove('is-active')
		index = (newIndex + slides.length) % slides.length
		slides[index].classList.add('is-active')
		dots[index].classList.add('is-active')
	}

	function restartAutoplay() {
		if (timer) clearInterval(timer)
		timer = setInterval(() => show(index + 1), 5000)
	}

	if (prevBtn) prevBtn.addEventListener('click', () => { show(index - 1); restartAutoplay() })
	if (nextBtn) nextBtn.addEventListener('click', () => { show(index + 1); restartAutoplay() })

	restartAutoplay()
}

// ---------- "Browse by section" cards ----------
function goToSection(section) {
	const select = document.getElementById('sectionFilter')
	const target = document.getElementById('materials')
	if (select) {
		select.value = section
		filterMaterials()
	}
	if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
window.goToSection = goToSection

// Page load
document.addEventListener('DOMContentLoaded', async function () {
	setCurrentYear()
	setupMobileNav()
	setupMediaCarousel()

	await testAPIConnectivity()

	loadMaterials()
	loadNews()
})

window.addEventListener('error', function (e) {
	debugLog('Global error:', e.error)
})

window.addEventListener('unhandledrejection', function (e) {
	debugLog('Unhandled promise rejection:', e.reason)
})

// Helper functions
function getSectionName(section) {
	const sections = {
		lectures: "📖 Ma'ruzalar",
		practicals: "✏️ Amaliy mashg'ulotlar",
		presentations: '📊 Taqdimotlar',
		books: "📚 Qo'llanma va kitoblar",
	}
	return sections[section] || section
}

function formatDate(dateString) {
	if (!dateString) return "Noma'lum sana"
	try {
		const date = new Date(dateString)
		if (isNaN(date.getTime())) return "Noma'lum sana"
		return date.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })
	} catch (e) {
		return "Noma'lum sana"
	}
}

function trackDownload(materialId, title) {
	showNotification(`"${title}" fayli yuklab olinmoqda...`, 'success')
}

// Download function with fallback methods
async function downloadMaterial(materialId, title, filename = 'file') {
	try {
		showNotification(`"${title}" yuklab olinmoqda...`, 'info')

		const materialsResponse = await fetchWithFallback('/materials')
		if (!materialsResponse.ok) throw new Error(`Materials API failed: ${materialsResponse.status}`)

		const materials = await materialsResponse.json()
		const material = materials.find(m => m._id === materialId)
		if (!material) throw new Error('Material topilmadi')
		if (!material.fileUrl && !material.fileKey) throw new Error('Bu materialga fayl biriktirilmagan')

		let downloadSuccess = false

		// Method 1: API download endpoint
		try {
			const downloadUrl = `${API_BASE}/materials/${materialId}/download`
			const downloadResponse = await fetch(downloadUrl, { method: 'HEAD' })
			if (downloadResponse.ok) {
				triggerDownload(downloadUrl, material.fileName || filename)
				downloadSuccess = true
				trackDownload(materialId, title)
				showNotification(`"${title}" yuklab olindi!`, 'success')
			}
		} catch (apiError) {
			debugLog('API download failed:', apiError.message)
		}

		// Method 2: Direct S3 URL fallback
		if (!downloadSuccess) {
			let directUrl = null
			if (material.fileUrl && !material.fileUrl.includes('placeholder')) {
				directUrl = material.fileUrl
			} else if (material.fileKey) {
				directUrl = `https://s3.twcstorage.ru/e008923b-dbcf87a4-7047-45d8-8a51-89a9793149a6/${material.fileKey}`
			}

			if (directUrl) {
				if (!directUrl.startsWith('http://') && !directUrl.startsWith('https://')) {
					directUrl = `https://${directUrl}`
				}
				triggerDownload(directUrl, material.fileName || filename, true)
				downloadSuccess = true
				trackDownload(materialId, title)
				showNotification(`"${title}" yuklab olindi!`, 'success')
			}
		}

		if (!downloadSuccess) throw new Error('Yuklab olish usullari ishlamadi')
	} catch (error) {
		debugLog(`Download error for ${title}:`, error.message)
		showNotification(`Yuklab olishda xatolik: ${error.message}`, 'error')
	}
}

function triggerDownload(url, filename, newTab = false) {
	const link = document.createElement('a')
	link.href = url
	link.download = filename
	if (newTab) link.target = '_blank'
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
}

function showNotification(message, type = 'info', duration = 3000) {
	const notification = document.createElement('div')
	notification.className = `notification notification-${type}`

	const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }

	notification.innerHTML = `
		<div class="notification-content">
			<span class="notification-icon">${icons[type] || icons.info}</span>
			<span class="notification-message">${message}</span>
		</div>
	`

	document.body.appendChild(notification)
	setTimeout(() => notification.classList.add('show'), 10)
	setTimeout(() => {
		notification.classList.remove('show')
		setTimeout(() => notification.remove(), 300)
	}, duration)
}

function updateMaterialsStats(materials) {
	const totalMaterials = materials.length
	const totalSections = new Set(materials.map(m => m.section)).size

	animateCounter('totalMaterials', totalMaterials)
	animateCounter('totalSections', totalSections)
}

function animateCounter(elementId, targetValue) {
	const element = document.getElementById(elementId)
	if (!element) return

	const currentValue = parseInt(element.textContent) || 0
	if (currentValue === targetValue) return

	const increment = targetValue > currentValue ? 1 : -1
	const stepTime = Math.abs(Math.floor(200 / (targetValue - currentValue))) || 1

	const timer = setInterval(() => {
		const current = parseInt(element.textContent) || 0
		if ((increment > 0 && current >= targetValue) || (increment < 0 && current <= targetValue)) {
			element.textContent = targetValue
			clearInterval(timer)
		} else {
			element.textContent = current + increment
		}
	}, stepTime)
}

// Global materials storage for filtering
let allMaterials = []

function filterMaterials() {
	const filterValue = document.getElementById('sectionFilter').value
	const container = document.getElementById('cardsContainer')
	if (!container || allMaterials.length === 0) return

	const filteredMaterials =
		filterValue === 'all' ? allMaterials : allMaterials.filter(m => m.section === filterValue)

	container.innerHTML = ''

	if (filteredMaterials.length === 0) {
		container.innerHTML = `
			<div class="no-data">
				<h3>🔍 Bu bo'limda materiallar topilmadi</h3>
				<p>Tanlangan bo'lim: <strong>${getSectionName(filterValue)}</strong></p>
				<button class="btn btn-dark" onclick="document.getElementById('sectionFilter').value='all'; filterMaterials();">Barcha materiallarni ko'rsatish</button>
			</div>
		`
		return
	}

	filteredMaterials.forEach(item => container.appendChild(renderMaterialCard(item)))
	updateMaterialsStats(filteredMaterials)
}
