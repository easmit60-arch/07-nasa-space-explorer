const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const button = document.querySelector('button');
const gallery = document.getElementById('gallery');
const modal = document.getElementById('apodModal');
const closeModalButton = document.getElementById('closeModal');
const modalMedia = document.getElementById('modalMedia');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const factText = document.getElementById('factText');

let currentItems = [];

const spaceFacts = [
	'The footprints left on the Moon can last for millions of years because there is no wind or rain there.',
	'One day on Venus is longer than one year on Venus.',
	'Neutron stars can spin hundreds of times every second.',
	'Jupiter has the shortest day of any planet in our solar system, at about 10 hours.',
	'Saturn could float in a giant ocean because it is less dense than water.',
	'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.'
];

// Use NASA's public demo key by default (works for classroom projects)
// If needed, you can set a custom key with: window.NASA_API_KEY = 'your_key'
const API_KEY = window.NASA_API_KEY || 'DEMO_KEY';

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

function showRandomFact() {
	const randomIndex = Math.floor(Math.random() * spaceFacts.length);
	factText.textContent = spaceFacts[randomIndex];
}

showRandomFact();

// Build one card for each APOD item and return the HTML string
function createGalleryCard(item, index) {
	// APOD sometimes returns videos; use the thumbnail when available
	const mediaUrl = item.media_type === 'video' && item.thumbnail_url
		? item.thumbnail_url
		: item.url;
	const hasImageToShow = item.media_type === 'image' || !!item.thumbnail_url;

	const mediaMarkup = hasImageToShow
		? `<img src="${mediaUrl}" alt="${item.title}" />`
		: `<a class="video-link" href="${item.url}" target="_blank" rel="noopener noreferrer">Open video in a new tab</a>`;

	return `
		<article class="gallery-item" data-index="${index}" tabindex="0" role="button" aria-label="Open details for ${item.title}">
			${mediaMarkup}
			<p><strong>${item.title}</strong> (${item.date})</p>
			<p>${item.explanation.slice(0, 170)}...</p>
		</article>
	`;
}

function getSelectedItemFromCard(card) {
	if (!card) {
		return null;
	}

	const index = Number(card.dataset.index);
	return currentItems[index] || null;
}

function getYoutubeEmbedUrl(url) {
	if (!url) {
		return '';
	}

	if (url.includes('youtube.com/watch?v=')) {
		return url.replace('watch?v=', 'embed/');
	}

	if (url.includes('youtu.be/')) {
		const videoId = url.split('youtu.be/')[1];
		return `https://www.youtube.com/embed/${videoId}`;
	}

	return '';
}

function openModal(item) {
	modalTitle.textContent = item.title;
	modalDate.textContent = item.date;
	modalExplanation.textContent = item.explanation;

	const highResImage = item.hdurl || item.url;
	const youtubeEmbedUrl = getYoutubeEmbedUrl(item.url);

	if (item.media_type === 'image') {
		modalMedia.innerHTML = `<img src="${highResImage}" alt="${item.title}" />`;
	} else if (youtubeEmbedUrl) {
		modalMedia.innerHTML = `<iframe src="${youtubeEmbedUrl}" title="${item.title}" allowfullscreen loading="lazy"></iframe>`;
	} else if (item.thumbnail_url) {
		modalMedia.innerHTML = `
			<img src="${item.thumbnail_url}" alt="${item.title}" />
			<p><a class="video-link" href="${item.url}" target="_blank" rel="noopener noreferrer">Watch this video on NASA APOD</a></p>
		`;
	} else {
		modalMedia.innerHTML = `<p><a class="video-link" href="${item.url}" target="_blank" rel="noopener noreferrer">Open this video in a new tab</a></p>`;
	}

	modal.classList.remove('hidden');
	modal.setAttribute('aria-hidden', 'false');
	document.body.classList.add('modal-open');
}

function closeModal() {
	modal.classList.add('hidden');
	modal.setAttribute('aria-hidden', 'true');
	modalMedia.innerHTML = '';
	document.body.classList.remove('modal-open');
}

function handleGalleryActivation(event) {
	const isKeyboardEvent = event.type === 'keydown';
	if (isKeyboardEvent && event.key !== 'Enter' && event.key !== ' ') {
		return;
	}

	const card = event.target.closest('.gallery-item');
	const selectedItem = getSelectedItemFromCard(card);
	if (!selectedItem) {
		return;
	}

	if (isKeyboardEvent) {
		event.preventDefault();
	}

	openModal(selectedItem);
}

// Fetch APOD data for the selected date range
async function getSpaceImages() {
	const startDate = startInput.value;
	const endDate = endInput.value;

	// Basic check so we do not call the API with missing dates
	if (!startDate || !endDate) {
		gallery.innerHTML = '<p class="placeholder">Please choose both start and end dates.</p>';
		return;
	}

	if (startDate > endDate) {
		gallery.innerHTML = '<p class="placeholder">Start date must be before end date.</p>';
		return;
	}

	gallery.innerHTML = '<p class="placeholder">🔄 Loading space photos...</p>';
	button.disabled = true;
	button.textContent = 'Loading...';

	const url = `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}&thumbs=true`;

	try {
		const response = await fetch(url);
		const data = await response.json();

		if (!response.ok) {
			const message = data.error?.message || data.msg || `Request failed with status ${response.status}`;
			throw new Error(message);
		}

		// The API can return one object or an array; normalize to an array
		const items = Array.isArray(data) ? data : [data];

		if (items.length === 0) {
			gallery.innerHTML = '<p class="placeholder">No images found for this date range.</p>';
			return;
		}

		// Show newest first so recent images appear at the top
		items.reverse();
		currentItems = items;

		gallery.innerHTML = items.map((item, index) => createGalleryCard(item, index)).join('');
	} catch (error) {
		currentItems = [];
		gallery.innerHTML = `<p class="placeholder">Could not load images right now. ${error.message}</p>`;
		console.error('Error loading NASA images:', error);
	} finally {
		button.disabled = false;
		button.textContent = 'Get Space Images';
	}
}

// Load images when the user clicks the button
button.addEventListener('click', getSpaceImages);

// Open modal when a gallery item is clicked or activated with keyboard
gallery.addEventListener('click', handleGalleryActivation);
gallery.addEventListener('keydown', handleGalleryActivation);

closeModalButton.addEventListener('click', closeModal);

modal.addEventListener('click', (event) => {
	if (event.target === modal) {
		closeModal();
	}
});

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
		closeModal();
	}
});
