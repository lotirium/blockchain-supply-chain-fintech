package com.shipment.app.glide;

import androidx.annotation.NonNull;
import android.util.Log;
import com.bumptech.glide.load.Options;
import com.bumptech.glide.load.ResourceDecoder;
import com.bumptech.glide.load.engine.Resource;
import com.bumptech.glide.load.resource.SimpleResource;
import com.caverock.androidsvg.SVG;
import com.caverock.androidsvg.SVGParseException;
import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class SvgDecoder implements ResourceDecoder<InputStream, SVG> {
    private static final String TAG = "SvgDecoder";
    private static final int HEADER_BUFFER_SIZE = 128;
    private static final String SVG_START_PATTERN = "<?xml";
    private static final String SVG_TAG_PATTERN = "<svg";

    @Override
    public boolean handles(@NonNull InputStream source, @NonNull Options options) {
        try {
            if (!source.markSupported()) {
                source = new BufferedInputStream(source);
            }
            
            source.mark(HEADER_BUFFER_SIZE);
            byte[] buffer = new byte[HEADER_BUFFER_SIZE];
            int bytesRead = source.read(buffer, 0, HEADER_BUFFER_SIZE);
            source.reset();

            if (bytesRead <= 0) {
                return false;
            }

            String header = new String(buffer, 0, bytesRead, StandardCharsets.UTF_8).toLowerCase();
            return header.contains(SVG_START_PATTERN) && header.contains(SVG_TAG_PATTERN);
        } catch (IOException e) {
            Log.w(TAG, "Error checking SVG header", e);
            return false;
        }
    }

    @Override
    public Resource<SVG> decode(@NonNull InputStream source, int width, int height,
                               @NonNull Options options) throws IOException {
        try {
            BufferedInputStream bufferedSource = source instanceof BufferedInputStream 
                ? (BufferedInputStream) source 
                : new BufferedInputStream(source);
                
            SVG svg = SVG.getFromInputStream(bufferedSource);
            if (svg == null) {
                throw new IOException("Failed to parse SVG - result was null");
            }
            return new SimpleResource<>(svg);
        } catch (SVGParseException e) {
            throw new IOException("Error parsing SVG", e);
        }
    }
}