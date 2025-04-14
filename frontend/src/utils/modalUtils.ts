export function closeModal(modal: HTMLElement | null): void {
  modal?.classList.add('hidden');
}

export function openModal(modal: HTMLElement | null): void {
  modal?.classList.remove('hidden');
}

export function showFeedback(
  elementId: string,
  message: string,
  isError: boolean
): void {
  const element = document.getElementById(
    elementId
  ) as HTMLParagraphElement | null;
  if (element) {
    element.textContent = message;
    element.classList.remove('text-red-600', 'text-green-600');
    element.classList.add(isError ? 'text-red-600' : 'text-green-600');
    element.classList.remove('invisible');
    element.classList.add('h-4');
  } else {
    console.warn(`Feedback element with ID "${elementId}" not found.`);
  }
}

export function clearFeedback(elementId: string): void {
  const element = document.getElementById(
    elementId
  ) as HTMLParagraphElement | null;
  if (element) {
    element.textContent = '';
    element.classList.remove('text-red-600', 'text-green-600');
    element.classList.add('invisible');
    element.classList.remove('h-4');
  }
}
