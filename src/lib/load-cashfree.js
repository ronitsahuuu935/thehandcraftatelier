let loading;

export function loadCashfree() {
  if (window.Cashfree) return Promise.resolve(window.Cashfree);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    const fail = () => {
      clearTimeout(timer);
      script.remove();
      loading = null;
      reject(new Error("Payment service could not load. Please try again."));
    };
    const timer = setTimeout(fail, 20000);
    script.onerror = fail;
    script.onload = () => {
      if (!window.Cashfree) return fail();
      clearTimeout(timer);
      resolve(window.Cashfree);
    };
    document.head.appendChild(script);
  });
  return loading;
}
