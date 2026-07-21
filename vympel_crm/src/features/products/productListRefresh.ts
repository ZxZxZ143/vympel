"use client";

const productListChangedEvent = "vympel:crm:products-changed";

export function notifyProductListChanged() {
  window.dispatchEvent(new Event(productListChangedEvent));
}

export function subscribeToProductListChanges(listener: () => void) {
  window.addEventListener(productListChangedEvent, listener);
  window.addEventListener("focus", listener);

  return () => {
    window.removeEventListener(productListChangedEvent, listener);
    window.removeEventListener("focus", listener);
  };
}
