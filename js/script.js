const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const button = document.querySelector('button');
const gallery = document.getElementById('gallery');
let requestCount = 0;


// NASA provides a public demo key for beginner projects
const API_KEY = 'rwzkR3d3SNKxVh1GTnlObdnHM92Fs6KXLF9dSeNW';

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);



// Build one card for each APOD item and return the HTML string
function createGalleryCard(item) {
	// APOD sometimes returns videos; use the thumbnail when available
	const mediaUrl = item.media_type === 'video' && item.thumbnail_url
		? item.thumbnail_url
		: item.url;

	return `
		<article class="gallery-item">
			<img src="${mediaUrl}" alt="${item.title}" />
			<p><strong>${item.title}</strong> (${item.date})</p>
			<p>${item.explanation}</p>
		</article>
	`;
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

	requestCount += 1;
	gallery.innerHTML = `<p class="placeholder">Loading request #${requestCount}...</p>`;
	button.disabled = true;
	button.textContent = 'Loading...';

	const url = `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}&thumbs=true`;

	try {
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Request failed with status ${response.status}`);
		}

		const data = await response.json();

		// The API can return one object or an array; normalize to an array
		const items = Array.isArray(data) ? data : [data];

		if (items.length === 0) {
			gallery.innerHTML = '<p class="placeholder">No images found for this date range.</p>';
			return;
		}

		// Show newest first so recent images appear at the top
		items.reverse();

		gallery.innerHTML = items.map((item) => createGalleryCard(item)).join('');
	} catch (error) {
		gallery.innerHTML = '<p class="placeholder">Could not load images right now. Please try again.</p>';
		console.error('Error loading NASA images:', error);
	} finally {
		button.disabled = false;
		button.textContent = 'Get Space Images';
	}
}

// Load images when the user clicks the button
button.addEventListener('click', getSpaceImages);
