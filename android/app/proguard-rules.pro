# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Keep model classes and their inner classes
-keep class com.shipment.app.models.** { *; }
-keep class com.shipment.app.models.**$* { *; }
-keep class com.shipment.app.api.responses.** { *; }

# Keep ViewModels and their inner classes
-keep class com.shipment.app.viewmodels.** { *; }
-keep class com.shipment.app.viewmodels.**$* { *; }

# Keep Repositories and their inner classes
-keep class com.shipment.app.repositories.** { *; }
-keep class com.shipment.app.repositories.**$* { *; }

# Keep enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Retrofit rules
-keepattributes Signature
-keepattributes *Annotation*
-keep class retrofit2.** { *; }
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}

# Glide rules
-keep public class * implements com.bumptech.glide.module.GlideModule
-keep class * extends com.bumptech.glide.module.AppGlideModule {
 <init>(...);
}
-keep public enum com.bumptech.glide.load.ImageHeaderParser$** {
  **[] $VALUES;
  public *;
}

# OkHttp rules
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**

# General Android rules
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep the BuildConfig
-keep class com.shipment.app.BuildConfig { *; }