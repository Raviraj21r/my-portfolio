if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
if (!window.location.hash) {
  window.scrollTo(0, 0);
}

const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.site-nav');
const contactForm = document.querySelector('#contact-form');
const formStatus = document.querySelector('#form-status');
const themeToggle = document.querySelector('.theme-toggle');
const toastRegion = document.querySelector('#toast-region');
const newsletterForm = document.querySelector('#newsletter-form');
const newsletterStatus = document.querySelector('#newsletter-status');
const cvDownload = document.querySelector('#cv-download');

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastRegion.append(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  window.setTimeout(() => {
    toast.classList.remove('is-visible');
    window.setTimeout(() => toast.remove(), 250);
  }, 4200);
}

cvDownload.addEventListener('click', (event) => {
  if (cvDownload.href.includes('example.com')) {
    event.preventDefault();
    showToast('Add your CV link in public/index.html first.', 'error');
  }
});

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === 'dark';
  themeToggle.textContent = isDark ? 'Light' : 'Dark';
  themeToggle.setAttribute('aria-pressed', String(isDark));
  themeToggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
}

applyTheme(localStorage.getItem('portfolio-theme') || 'light');
themeToggle.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('portfolio-theme', nextTheme);
  applyTheme(nextTheme);
});

function closeMenu() {
  navigation.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.querySelector('b').textContent = 'Open menu';
}

menuButton.addEventListener('click', () => {
  const isOpen = navigation.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.querySelector('b').textContent = isOpen ? 'Close menu' : 'Open menu';
});

document.querySelectorAll('.site-nav a, .header-cta').forEach((link) => link.addEventListener('click', closeMenu));
document.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener('click', (event) => {
  const target = document.querySelector(link.getAttribute('href'));
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  history.replaceState(null, '', link.getAttribute('href'));
}));

let activeFilter = 'all';

function applyProjectFilter(filter = activeFilter) {
  activeFilter = filter;
  document.querySelectorAll('.filter-button').forEach((button) => button.classList.toggle('is-active', button.dataset.filter === filter));
  document.querySelectorAll('.work-card').forEach((card) => {
    const shouldShow = filter === 'all' || card.dataset.category === filter;
    card.classList.toggle('is-hidden', !shouldShow);
  });
}

document.querySelectorAll('.filter-button').forEach((filterButton) => filterButton.addEventListener('click', () => {
  const filter = filterButton.dataset.filter;
  applyProjectFilter(filter);
}));

// Skill Modal Functionality
const skillModal = document.querySelector('#skill-modal');
const modalBackdrop = skillModal?.querySelector('.modal-backdrop');
const modalClose = skillModal?.querySelector('.modal-close');
const modalTitle = skillModal?.querySelector('#modal-title');
const modalIntro = skillModal?.querySelector('.modal-intro');
const modalDetail = skillModal?.querySelector('.modal-detail');
const modalTech = skillModal?.querySelector('.modal-tech');
const modalBuild = skillModal?.querySelector('.modal-build');
let lastFocusedElement = null;

function openModal(card) {
  if (!skillModal) return;
  
  lastFocusedElement = document.activeElement;
  
  modalTitle.textContent = card.dataset.skillTitle || '';
  modalIntro.textContent = card.dataset.skillIntro || '';
  modalDetail.textContent = card.dataset.skillDetail || '';
  modalTech.textContent = card.dataset.skillTech || '';
  modalBuild.textContent = card.dataset.skillBuild || '';
  
  skillModal.classList.add('is-open');
  skillModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  
  modalClose?.focus();
  
  const focusableElements = skillModal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  skillModal.addEventListener('keydown', trapFocus);
  
  function trapFocus(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }
  }
}

function closeModal() {
  if (!skillModal) return;
  
  skillModal.classList.remove('is-open');
  skillModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  
  skillModal.removeEventListener('keydown', trapFocus);
  
  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

function setupSkillCard(card) {
  card.addEventListener('click', () => openModal(card));
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openModal(card);
    }
  });
}

modalClose?.addEventListener('click', closeModal);
modalBackdrop?.addEventListener('click', closeModal);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && skillModal?.classList.contains('is-open')) {
    closeModal();
  }
});

// Project Modal Functionality
const projectModal = document.querySelector('#project-modal');
const projectFormModal = document.querySelector('#project-form-modal');
const addProjectBtn = document.querySelector('.add-project-btn');
const addProjectForm = document.querySelector('#add-project-form');
const cancelProjectForm = document.querySelector('#cancel-project-form');
const projectImagePreview = document.querySelector('#project-image-preview');
const removeImageBtn = document.querySelector('.remove-image-btn');
let currentProjectCard = null;
let projectImageData = null;
let projectFocusTrap = null;

function openProjectModal(card) {
  if (!projectModal) return;
  
  currentProjectCard = card;
  lastFocusedElement = document.activeElement;
  
  document.querySelector('#project-modal-title').textContent = card.dataset.projectTitle || '';
  document.querySelector('#modal-project-overview').textContent = card.dataset.projectOverview || '';
  document.querySelector('#modal-project-problem').textContent = card.dataset.projectProblem || '';
  document.querySelector('#modal-project-features').textContent = card.dataset.projectFeatures || '';
  document.querySelector('#modal-project-tech').textContent = card.dataset.projectTech || '';
  document.querySelector('#modal-project-role').textContent = card.dataset.projectRole || '';
  document.querySelector('#modal-project-challenges').textContent = card.dataset.projectChallenges || '';
  document.querySelector('#modal-project-solutions').textContent = card.dataset.projectSolutions || '';
  document.querySelector('#modal-project-results').textContent = card.dataset.projectResults || '';
  
  const demoLink = document.querySelector('#modal-project-demo');
  const githubLink = document.querySelector('#modal-project-github');
  const projectImageFrame = projectModal.querySelector('#modal-project-image-link');
  const demoUrl = card.dataset.projectDemo || '';
  let projectImage = projectImageFrame.querySelector('#modal-project-image');
  projectImageFrame.querySelector('.project-modal-artwork')?.remove();
  
  demoLink.href = demoUrl || '#';
  githubLink.href = card.dataset.projectGithub || '#';
  projectImageFrame.href = demoUrl || '#';
  projectImageFrame.classList.toggle('is-disabled', !demoUrl);
  projectImageFrame.setAttribute('aria-label', demoUrl ? `Open ${card.dataset.projectTitle || 'project'} live demo` : 'Project preview');
  
  if (demoUrl && demoUrl !== '#') {
    demoLink.style.display = 'inline-flex';
  } else {
    demoLink.style.display = 'none';
  }
  
  if (card.dataset.projectGithub && card.dataset.projectGithub !== '#') {
    githubLink.style.display = 'inline-flex';
  } else {
    githubLink.style.display = 'none';
  }
  
  if (card.dataset.projectImage) {
    if (!projectImage) {
      projectImage = document.createElement('img');
      projectImage.id = 'modal-project-image';
      projectImageFrame.append(projectImage);
    }
    projectImage.src = card.dataset.projectImage;
    projectImage.alt = `${card.dataset.projectTitle || 'Project'} preview`;
    projectImage.style.display = 'block';
  } else {
    const cardArtwork = card.querySelector('.work-image');
    const artwork = cardArtwork?.cloneNode(true);
    if (projectImage) projectImage.style.display = 'none';
    projectImageFrame.append(artwork);
    if (artwork) {
      artwork.className = 'project-modal-artwork';
    }
  }
  
  projectModal.classList.add('is-open');
  projectModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  
  const closeBtn = projectModal.querySelector('.modal-close');
  closeBtn?.focus();
  
  const focusableElements = projectModal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  projectFocusTrap = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }
  };
  projectModal.addEventListener('keydown', projectFocusTrap);
}

function closeProjectModal() {
  if (!projectModal) return;
  
  projectModal.classList.remove('is-open');
  projectModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  
  if (projectFocusTrap) {
    projectModal.removeEventListener('keydown', projectFocusTrap);
    projectFocusTrap = null;
  }
  
  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
  currentProjectCard = null;
}

function openProjectFormModal(editData = null) {
  if (!projectFormModal) return;
  
  lastFocusedElement = document.activeElement;
  
  if (editData) {
    document.querySelector('#project-form-modal-title').textContent = 'Edit Project';
    addProjectForm.querySelector('[name="edit-id"]').value = editData.id;
    addProjectForm.querySelector('[name="title"]').value = editData.title;
    addProjectForm.querySelector('[name="category"]').value = editData.category;
    addProjectForm.querySelector('[name="color"]').value = editData.color;
    addProjectForm.querySelector('[name="description"]').value = editData.description;
    addProjectForm.querySelector('[name="overview"]').value = editData.overview;
    addProjectForm.querySelector('[name="problem"]').value = editData.problem;
    addProjectForm.querySelector('[name="features"]').value = editData.features;
    addProjectForm.querySelector('[name="tech"]').value = editData.tech;
    addProjectForm.querySelector('[name="role"]').value = editData.role;
    addProjectForm.querySelector('[name="challenges"]').value = editData.challenges;
    addProjectForm.querySelector('[name="solutions"]').value = editData.solutions;
    addProjectForm.querySelector('[name="results"]').value = editData.results;
    addProjectForm.querySelector('[name="demo"]').value = editData.demo;
    addProjectForm.querySelector('[name="github"]').value = editData.github;
    
    if (editData.image) {
      projectImageData = editData.image;
      projectImagePreview.querySelector('img').src = editData.image;
      projectImagePreview.style.display = 'block';
    }
  } else {
    document.querySelector('#project-form-modal-title').textContent = 'Add New Project';
    addProjectForm.reset();
    addProjectForm.querySelector('[name="edit-id"]').value = '';
    projectImageData = null;
    projectImagePreview.style.display = 'none';
  }
  
  projectFormModal.classList.add('is-open');
  projectFormModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  
  const closeBtn = projectFormModal.querySelector('.modal-close');
  closeBtn?.focus();
}

function closeProjectFormModal() {
  if (!projectFormModal) return;
  
  projectFormModal.classList.remove('is-open');
  projectFormModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  
  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

function setupProjectCard(card) {
  card.addEventListener('click', () => openProjectModal(card));
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openProjectModal(card);
    }
  });
}

document.querySelectorAll('.work-card').forEach(setupProjectCard);

addProjectBtn?.addEventListener('click', () => openProjectFormModal());
cancelProjectForm?.addEventListener('click', closeProjectFormModal);

projectModal?.querySelector('.modal-close')?.addEventListener('click', closeProjectModal);
projectModal?.querySelector('.modal-backdrop')?.addEventListener('click', closeProjectModal);

projectFormModal?.querySelector('.modal-close')?.addEventListener('click', closeProjectFormModal);
projectFormModal?.querySelector('.modal-backdrop')?.addEventListener('click', closeProjectFormModal);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (projectModal?.classList.contains('is-open')) {
      closeProjectModal();
    }
    if (projectFormModal?.classList.contains('is-open')) {
      closeProjectFormModal();
    }
  }
});

// Image preview handling
addProjectForm?.querySelector('[name="image"]')?.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be smaller than 2 MB.', 'error');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      projectImageData = reader.result;
      projectImagePreview.querySelector('img').src = reader.result;
      projectImagePreview.style.display = 'block';
    }, { once: true });
    reader.readAsDataURL(file);
  }
});

removeImageBtn?.addEventListener('click', () => {
  projectImageData = null;
  projectImagePreview.style.display = 'none';
  addProjectForm.querySelector('[name="image"]').value = '';
});

// Edit and delete buttons
document.querySelector('#modal-project-edit')?.addEventListener('click', () => {
  if (!currentProjectCard) return;
  
  const editData = {
    id: Array.from(workGrid?.children || []).indexOf(currentProjectCard),
    title: currentProjectCard.dataset.projectTitle,
    category: currentProjectCard.dataset.category,
    color: currentProjectCard.querySelector('.work-image')?.classList[1] || 'work-blue',
    description: currentProjectCard.querySelector('p')?.textContent || '',
    overview: currentProjectCard.dataset.projectOverview,
    problem: currentProjectCard.dataset.projectProblem,
    features: currentProjectCard.dataset.projectFeatures,
    tech: currentProjectCard.dataset.projectTech,
    role: currentProjectCard.dataset.projectRole,
    challenges: currentProjectCard.dataset.projectChallenges,
    solutions: currentProjectCard.dataset.projectSolutions,
    results: currentProjectCard.dataset.projectResults,
    demo: currentProjectCard.dataset.projectDemo,
    github: currentProjectCard.dataset.projectGithub,
    image: currentProjectCard.dataset.projectImage
  };
  
  closeProjectModal();
  openProjectFormModal(editData);
});

document.querySelector('#modal-project-delete')?.addEventListener('click', () => {
  if (!currentProjectCard) return;
  
  if (confirm('Are you sure you want to delete this project?')) {
    const projects = JSON.parse(localStorage.getItem('portfolio-projects') || '[]');
    const title = currentProjectCard.dataset.projectTitle;
    const indexToDelete = projects.findIndex((p) => p.title === title);
    
    if (indexToDelete >= 0) {
      projects.splice(indexToDelete, 1);
      localStorage.setItem('portfolio-projects', JSON.stringify(projects));
    }
    
    currentProjectCard.remove();
    closeProjectModal();
    showToast('Project deleted successfully.', 'success');
  }
});

// Project form submission
addProjectForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  
  const formData = new FormData(addProjectForm);
  const editId = formData.get('edit-id');
  
  const project = {
    title: formData.get('title').trim(),
    category: formData.get('category'),
    color: formData.get('color'),
    description: formData.get('description').trim(),
    overview: formData.get('overview').trim(),
    problem: formData.get('problem').trim(),
    features: formData.get('features').trim(),
    tech: formData.get('tech').trim(),
    role: formData.get('role').trim(),
    challenges: formData.get('challenges').trim(),
    solutions: formData.get('solutions').trim(),
    results: formData.get('results').trim(),
    demo: formData.get('demo').trim(),
    github: formData.get('github').trim(),
    image: projectImageData || ''
  };
  
  const projects = JSON.parse(localStorage.getItem('portfolio-projects') || '[]');
  
  if (editId) {
    projects[parseInt(editId)] = project;
    showToast('Project updated successfully.', 'success');
  } else {
    projects.push(project);
    showToast('Project added successfully.', 'success');
  }
  
  localStorage.setItem('portfolio-projects', JSON.stringify(projects));
  
  // Re-render projects
  const workGrid = document.querySelector('#work-grid');
  if (workGrid) {
    workGrid.innerHTML = '';
    projects.forEach((p) => workGrid.append(createProjectCard(p)));
    applyProjectFilter(activeFilter);
  }
  
  closeProjectFormModal();
  addProjectForm.reset();
  projectImageData = null;
  projectImagePreview.style.display = 'none';
});

document.querySelectorAll('.skill-card').forEach(setupSkillCard);

const workGrid = document.querySelector('#work-grid');

function createProjectCard(project) {
  const card = document.createElement('article');
  card.className = 'work-card user-project';
  card.dataset.category = project.category;
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  
  // Set all data attributes for modal
  card.dataset.projectTitle = project.title;
  card.dataset.projectOverview = project.overview || '';
  card.dataset.projectProblem = project.problem || '';
  card.dataset.projectFeatures = project.features || '';
  card.dataset.projectTech = project.tech || '';
  card.dataset.projectRole = project.role || '';
  card.dataset.projectChallenges = project.challenges || '';
  card.dataset.projectSolutions = project.solutions || '';
  card.dataset.projectResults = project.results || '';
  card.dataset.projectDemo = project.demo || '';
  card.dataset.projectGithub = project.github || '';
  card.dataset.projectImage = project.image || '';
  
  const image = document.createElement('div');
  image.className = `work-image ${project.color || 'work-blue'}`;
  
  if (project.image) {
    const imageElement = document.createElement('img');
    imageElement.src = project.image;
    imageElement.alt = `${project.title} preview`;
    image.classList.add('project-image');
    image.append(imageElement);
  } else {
    const label = document.createElement('span');
    label.textContent = project.title;
    image.append(label);
  }
  
  const arrow = document.createElement('b');
  arrow.textContent = '↗';
  image.append(arrow);
  
  const info = document.createElement('div');
  info.className = 'work-info';
  const title = document.createElement('h3');
  title.textContent = project.title;
  const description = document.createElement('p');
  description.textContent = project.description;
  
  info.append(title, description);
  card.append(image, info);
  
  setupProjectCard(card);
  return card;
}

function renderSavedProjects() {
  const savedProjects = JSON.parse(localStorage.getItem('portfolio-projects') || '[]');
  savedProjects.forEach((project) => workGrid.append(createProjectCard(project)));
  applyProjectFilter(activeFilter);
}

renderSavedProjects();

document.querySelectorAll('.reveal').forEach((element) => {
  new IntersectionObserver(([entry], observer) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.disconnect();
  }, { threshold: 0.12 }).observe(element);
});
document.querySelectorAll('.hero .reveal').forEach((element) => element.classList.add('is-visible'));

function revealVisibleContent() {
  document.querySelectorAll('.reveal, .skill-card, .work-card').forEach((element) => {
    const bounds = element.getBoundingClientRect();
    if (bounds.top < window.innerHeight * 0.95 && bounds.bottom > 0) {
      element.classList.add('is-visible');
    }
  });
}

revealVisibleContent();
window.addEventListener('scroll', revealVisibleContent, { passive: true });

// Skill cards stagger animation
const skillsGrid = document.querySelector('#skill-grid');
if (skillsGrid) {
  const skillCards = skillsGrid.querySelectorAll('.skill-card');
  new IntersectionObserver(([entry], observer) => {
    if (!entry.isIntersecting) return;
    skillCards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('is-visible');
      }, index * 100);
    });
    observer.disconnect();
  }, { threshold: 0.1 }).observe(skillsGrid);
}

// Project cards stagger animation
if (workGrid) {
  const workCards = workGrid.querySelectorAll('.work-card');
  new IntersectionObserver(([entry], observer) => {
    if (!entry.isIntersecting) return;
    workCards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('is-visible');
      }, index * 100);
    });
    observer.disconnect();
  }, { threshold: 0.1 }).observe(workGrid);
}

contactForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = contactForm.querySelector('button[type="submit"]');
  button.disabled = true;
  formStatus.className = 'form-status';
  formStatus.textContent = 'Sending your message...';
  try {
    const response = await fetch('https://my-portfolio-unrz.onrender.com/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(contactForm)))
    });
    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error(`Server returned an invalid response (${response.status}).`);
    }
    if (!response.ok || result.ok !== true || result.emailSent !== true) {
      throw new Error(result.error || 'Message was not delivered. Please try again.');
    }
    formStatus.className = 'form-status success';
    formStatus.textContent = 'Message received. I will get back to you soon.';
    showToast('Your message was sent successfully.', 'success');
    contactForm.reset();
  } catch (error) {
    formStatus.className = 'form-status error';
    formStatus.textContent = error.message || 'Something went wrong. Please try again.';
    showToast(formStatus.textContent, 'error');
  } finally {
    button.disabled = false;
  }
});

newsletterForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = new FormData(newsletterForm).get('email').trim().toLowerCase();
  const subscribers = JSON.parse(localStorage.getItem('portfolio-subscribers') || '[]');
  if (!subscribers.includes(email)) subscribers.push(email);
  localStorage.setItem('portfolio-subscribers', JSON.stringify(subscribers));
  newsletterForm.reset();
  newsletterStatus.textContent = 'You are on the list. Thank you.';
  showToast('Newsletter subscription saved.', 'success');
});
