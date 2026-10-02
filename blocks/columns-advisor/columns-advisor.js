/*
 * Columns Advisor block
 * Advisor-locator band: icon + trust heading on the left; a ZIP-code advisor search card on the
 * right, followed by a disclosure line.
 *
 * Authored structure: one row, two cells.
 *   cell 1: icon image + heading
 *   cell 2: paragraphs, in order:
 *             1st  - search label ("Search for a financial advisor by ZIP Code")
 *             2nd+ - lines shown inside the search card
 *                    (e.g. "Or, request an appointment online...")
 *             last - disclosure shown below the card (only when there are 3+ paragraphs)
 *
 * The ZIP input, Search button and "Find my location" control are NOT authored - they are
 * rendered here and submit to the Ameriprise advisor search.
 */

const OPTION_CLASSES = [];

/* Ameriprise advisor search endpoint. The ZIP is sent as ?zip=, geolocation as ?lat=&lng= */
const ADVISOR_SEARCH_URL = 'https://www.ameriprise.com/find-an-advisor';
const ZIP_PATTERN = /^\d{5}$/;
const DEFAULT_LABEL = 'Search for a financial advisor by ZIP Code';

let formCount = 0;

function goToSearch(params) {
  const url = new URL(ADVISOR_SEARCH_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  window.location.assign(url.toString());
}

function buildSearchForm(labelText) {
  formCount += 1;
  const inputId = `columns-advisor-zip-${formCount}`;
  const errorId = `${inputId}-error`;

  const form = document.createElement('form');
  form.className = 'columns-advisor-form';
  form.setAttribute('role', 'search');
  form.noValidate = true;
  form.action = ADVISOR_SEARCH_URL;
  form.method = 'get';

  const label = document.createElement('label');
  label.className = 'columns-advisor-label';
  label.htmlFor = inputId;
  label.textContent = labelText || DEFAULT_LABEL;

  const controls = document.createElement('div');
  controls.className = 'columns-advisor-controls';

  const field = document.createElement('div');
  field.className = 'columns-advisor-field';

  const input = document.createElement('input');
  input.type = 'text';
  input.id = inputId;
  input.name = 'zip';
  input.inputMode = 'numeric';
  input.autocomplete = 'postal-code';
  input.maxLength = 5;
  input.pattern = '[0-9]{5}';
  input.placeholder = 'Enter 5-digit ZIP Code';
  input.setAttribute('aria-describedby', errorId);

  const error = document.createElement('p');
  error.className = 'columns-advisor-error';
  error.id = errorId;
  error.setAttribute('aria-live', 'polite');

  const locate = document.createElement('button');
  locate.type = 'button';
  locate.className = 'columns-advisor-locate';
  locate.textContent = 'Find my location';

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'button primary columns-advisor-submit';
  submit.textContent = 'Search';

  const showError = (msg) => {
    error.textContent = msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  };

  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '').slice(0, 5);
    if (error.textContent) showError('');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const zip = input.value.trim();
    if (!ZIP_PATTERN.test(zip)) {
      showError('Please enter a valid 5-digit ZIP Code.');
      input.focus();
      return;
    }
    showError('');
    goToSearch({ zip });
  });

  locate.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showError('Location is not available in this browser. Please enter a ZIP Code.');
      return;
    }
    locate.disabled = true;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        locate.disabled = false;
        goToSearch({ lat: coords.latitude.toFixed(4), lng: coords.longitude.toFixed(4) });
      },
      () => {
        locate.disabled = false;
        showError('We could not determine your location. Please enter a ZIP Code.');
      },
      { timeout: 10000 },
    );
  });

  field.append(input, locate, error);
  controls.append(field, submit);
  form.append(label, controls);
  return form;
}

export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const row = block.firstElementChild;
  if (!row) return;
  row.classList.add('columns-advisor-row');
  [...block.children].slice(1).forEach((extra) => extra.classList.add('columns-advisor-row'));

  const [intro, search] = [...row.children];

  if (intro) {
    intro.classList.add('columns-advisor-intro');
    const picture = intro.querySelector('picture');
    if (picture) {
      const holder = picture.parentElement && picture.parentElement.tagName === 'P'
        && picture.parentElement.children.length === 1 ? picture.parentElement : picture;
      holder.classList.add('columns-advisor-icon');
    }
  }

  const searchCell = search || document.createElement('div');
  if (!search) row.append(searchCell);
  searchCell.classList.add('columns-advisor-search');

  const paragraphs = [...searchCell.children].filter((el) => el.textContent.trim());
  let labelText = '';
  let labelEl = null;
  // the first paragraph is the label only when it is plain text (no link)
  if (paragraphs[0] && !paragraphs[0].querySelector('a')) {
    [labelEl] = paragraphs;
    labelText = labelEl.textContent.trim();
  }
  const rest = paragraphs.filter((p) => p !== labelEl);
  const disclosure = paragraphs.length >= 3 ? rest.pop() : null;

  const card = document.createElement('div');
  card.className = 'columns-advisor-card';
  card.append(buildSearchForm(labelText));

  if (rest.length) {
    const links = document.createElement('div');
    links.className = 'columns-advisor-links';
    rest.forEach((p) => {
      // keep appointment links inline, not as standalone buttons
      p.classList.remove('button-container');
      p.querySelectorAll('a.button').forEach((a) => a.classList.remove('button', 'primary', 'secondary'));
      links.append(p);
    });
    card.append(links);
  }

  // keep the authored label element (it carries UE instrumentation) but hide it
  if (labelEl) labelEl.classList.add('columns-advisor-label-source');

  searchCell.prepend(card);
  if (labelEl) searchCell.append(labelEl);
  if (disclosure) {
    disclosure.classList.add('columns-advisor-disclosure');
    disclosure.classList.remove('button-container');
    disclosure.querySelectorAll('a.button').forEach((a) => a.classList.remove('button', 'primary', 'secondary'));
    searchCell.append(disclosure);
  }
}
