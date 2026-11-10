# ==============================================================================
# TrustPassz Mobile (mb_user) - R8 / Proguard Optimization Rules
# Target: APK/AAB Bundle Size < 50MB (Target: 15MB - 35MB), Zero WSOD & Crashes
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. General Optimization & Shrinking Directives
# ------------------------------------------------------------------------------
-dontpreverify
-repackageclasses
-allowaccessmodification
-dontusemixedcaseclassnames
-skipnonpubliclibraryclasses
-verbose

# Preserve critical runtime annotations, signatures, and line numbers for crash diagnostics
-keepattributes *Annotation*
-keepattributes JavascriptInterface
-keepattributes EnclosingMethod
-keepattributes InnerClasses
-keepattributes Signature
-keepattributes Exceptions
-keepattributes SourceFile,LineNumberTable

# ------------------------------------------------------------------------------
# 2. Capacitor Core & Bridge Architecture
# ------------------------------------------------------------------------------
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep enum com.getcapacitor.** { *; }

# Preserve WebView JavascriptInterface bridge methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve Capacitor Plugin classes and reflection entry points
-keep public class * extends com.getcapacitor.Plugin {
    public <init>();
    public <init>(...);
    public <methods>;
}

-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public *;
}

# Capacitor bridge Cordova compatibility interfaces if referenced
-dontwarn com.getcapacitor.cordova.**

# ------------------------------------------------------------------------------
# 3. Capacitor Official Native Plugins (The Essential 6)
# ------------------------------------------------------------------------------
# Plugin 1: @capacitor/app
-keep class com.capacitorjs.plugins.app.** { *; }

# Plugin 2: @capacitor/camera (Camera, Gallery, File Provider, Exif)
-keep class com.capacitorjs.plugins.camera.** { *; }

# Plugin 3: @capacitor/browser (Custom Tabs)
-keep class com.capacitorjs.plugins.browser.** { *; }

# Plugin 4: @capacitor/clipboard
-keep class com.capacitorjs.plugins.clipboard.** { *; }

# Plugin 5: @capacitor/preferences (SharedPreferences bridge)
-keep class com.capacitorjs.plugins.preferences.** { *; }

# Plugin 6: @capacitor/status-bar
-keep class com.capacitorjs.plugins.statusbar.** { *; }

# ------------------------------------------------------------------------------
# 4. AndroidX, Hardware Camera & FileProvider Protection
# ------------------------------------------------------------------------------
-keep class androidx.core.content.FileProvider { *; }
-keep public class * extends androidx.core.content.FileProvider
-keep class androidx.camera.** { *; }
-keep class androidx.appcompat.widget.** { *; }
-keep class androidx.browser.customtabs.** { *; }

-keepclassmembers class android.webkit.WebView {
    public *;
}
-dontwarn android.webkit.**
-dontwarn androidx.**

# ------------------------------------------------------------------------------
# 5. Hybrid Engine Bridge Rules (Flutter & FCM compatibility)
# ------------------------------------------------------------------------------
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

-keep class com.google.firebase.messaging.** { *; }
-dontwarn com.google.firebase.messaging.**
-keep class com.dexterous.flutterlocalnotifications.** { *; }
-keep class com.google.gson.reflect.TypeToken { *; }
-keep class * extends com.google.gson.reflect.TypeToken

# ------------------------------------------------------------------------------
# 6. JSON Serialization & Reflection Data Transfer Objects
# ------------------------------------------------------------------------------
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

