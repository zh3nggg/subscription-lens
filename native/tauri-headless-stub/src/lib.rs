//! Compile-time Tauri façade for the embedded, windowless CC Switch router.
//!
//! The real proxy treats AppHandle as optional.  These APIs exist solely so
//! the unchanged upstream source can compile without linking WebView/window
//! libraries; the sidecar never creates an AppHandle.
use std::{marker::PhantomData, ops::Deref};

#[derive(Clone, Debug, Default)] pub struct AppHandle;
#[derive(Clone, Debug, Default)] pub struct TrayIcon;
#[derive(Debug, Clone)] pub struct Error;
impl std::fmt::Display for Error { fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result { f.write_str("headless Tauri facade") } }
impl std::error::Error for Error {}
pub trait Emitter { fn emit<S: serde::Serialize + Clone>(&self, _event: &str, _payload: S) -> Result<(), Error>; }
impl Emitter for AppHandle { fn emit<S: serde::Serialize + Clone>(&self, _: &str, _: S) -> Result<(), Error> { Ok(()) } }
pub struct State<'a, T>(PhantomData<(&'a (), T)>);
impl<'a, T> Deref for State<'a, T> {
  type Target = T;
  fn deref(&self) -> &T {
    // The embedded runtime never constructs a Tauri AppHandle.  Panicking
    // here makes an accidental GUI-only path fail visibly instead of causing
    // undefined behaviour in the headless host.
    panic!("CC Switch GUI state is unavailable in Subscription Lens' headless router")
  }
}
impl<'a, T> State<'a, T> { pub fn inner(&self) -> &T { self.deref() } }
pub trait Manager {
  fn state<T>(&self) -> State<'_, T> { State(PhantomData) }
  fn try_state<T>(&self) -> Option<State<'_, T>> { None }
  fn tray_by_id(&self, _: &str) -> Option<TrayIcon> { None }
}
impl Manager for AppHandle {}
impl TrayIcon { pub fn set_menu<T>(&self, _: Option<T>) -> Result<(), Error> { Ok(()) } }
pub mod async_runtime { pub fn block_on<F: std::future::Future>(future: F) -> F::Output { tokio::runtime::Runtime::new().expect("headless runtime").block_on(future) } pub fn spawn<F>(future: F) where F: std::future::Future<Output = ()> + Send + 'static { tokio::runtime::Handle::try_current().map(|handle| handle.spawn(future)).ok(); } }
