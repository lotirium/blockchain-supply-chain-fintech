package com.shipment.app.glide;

import android.content.Context;
import android.graphics.Picture;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.PictureDrawable;
import androidx.annotation.NonNull;
import com.bumptech.glide.Glide;
import com.shipment.app.R;
import com.caverock.androidsvg.SVG;
import java.io.InputStream;
import com.bumptech.glide.GlideBuilder;
import com.bumptech.glide.Registry;
import com.bumptech.glide.annotation.GlideModule;
import com.bumptech.glide.load.DecodeFormat;
import com.bumptech.glide.load.engine.DiskCacheStrategy;
import com.bumptech.glide.load.engine.bitmap_recycle.LruBitmapPool;
import com.bumptech.glide.load.engine.cache.InternalCacheDiskCacheFactory;
import com.bumptech.glide.load.engine.cache.LruResourceCache;
import com.bumptech.glide.load.engine.executor.GlideExecutor;
import com.bumptech.glide.load.resource.bitmap.DownsampleStrategy;
import com.bumptech.glide.module.AppGlideModule;
import com.bumptech.glide.Priority;
import com.bumptech.glide.request.RequestOptions;

@GlideModule
public final class ShipmentGlideModule extends AppGlideModule {
    @Override
    public void applyOptions(@NonNull Context context, @NonNull GlideBuilder builder) {
        // Calculate optimal memory cache size (15% of available memory)
        int maxMemory = (int) (Runtime.getRuntime().maxMemory() / 1024);
        int memoryCacheSize = maxMemory / 6;
        builder.setMemoryCache(new LruResourceCache(memoryCacheSize * 1024));
        
        // Set disk cache size (50MB)
        int diskCacheSizeBytes = 50 * 1024 * 1024;
        builder.setDiskCache(new InternalCacheDiskCacheFactory(context, diskCacheSizeBytes));

        // Configure bitmap pool for recycling
        builder.setBitmapPool(new LruBitmapPool(memoryCacheSize * 1024));
        
        // Set default request options with improved configuration
        builder.setDefaultRequestOptions(
            new RequestOptions()
                .format(DecodeFormat.PREFER_RGB_565) // More memory efficient
                .diskCacheStrategy(DiskCacheStrategy.RESOURCE)
                .skipMemoryCache(false)
                .centerInside()
                .encodeQuality(85) // Slightly reduce quality for better performance
                .downsample(DownsampleStrategy.CENTER_INSIDE) // Efficient downsampling
                .priority(Priority.NORMAL)
                .dontAnimate() // Skip animations for smoother scrolling
        );

        // Configure background thread settings
        int cores = Math.max(1, Runtime.getRuntime().availableProcessors());
        builder.setSourceExecutor(GlideExecutor.newSourceExecutor())
               .setDiskCacheExecutor(GlideExecutor.newDiskCacheExecutor())
               .setAnimationExecutor(GlideExecutor.newAnimationExecutor());
    }

    @Override
    public void registerComponents(@NonNull Context context, @NonNull Glide glide, @NonNull Registry registry) {
        // Register SVG handling components
        registry.register(SVG.class, PictureDrawable.class, new SvgDrawableTranscoder())
                .append(InputStream.class, SVG.class, new SvgDecoder());
    }

    @Override
    public boolean isManifestParsingEnabled() {
        return false;
    }
}