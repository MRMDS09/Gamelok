const { withMainActivity } = require('@expo/config-plugins');

// Applied only when Expo generates the native Android project for a real build.
module.exports = function withImmersiveAndroid(config) {
  return withMainActivity(config, (mod) => {
    const activity = mod.modResults;
    if (activity.language !== 'kt') {
      throw new Error('Immersive Android configuration expects a Kotlin MainActivity');
    }

    if (activity.contents.includes('applyGamelokImmersiveMode()')) {
      return mod;
    }

    const anchor = 'class MainActivity : ReactActivity() {';
    if (!activity.contents.includes(anchor)) {
      throw new Error('Could not locate the Expo MainActivity declaration');
    }

    activity.contents = activity.contents.replace(anchor, `${anchor}
  private fun applyGamelokImmersiveMode() {
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
      window.insetsController?.apply {
        hide(android.view.WindowInsets.Type.statusBars() or android.view.WindowInsets.Type.navigationBars())
        systemBarsBehavior = android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
      }
    } else {
      @Suppress("DEPRECATION")
      window.decorView.systemUiVisibility = (
        android.view.View.SYSTEM_UI_FLAG_FULLSCREEN or
        android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
        android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
      )
    }
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    if (hasFocus) applyGamelokImmersiveMode()
  }

  override fun onResume() {
    super.onResume()
    applyGamelokImmersiveMode()
  }
`);
    return mod;
  });
};
