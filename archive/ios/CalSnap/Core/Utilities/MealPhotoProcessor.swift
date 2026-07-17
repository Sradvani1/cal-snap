import UIKit

struct PreparedMealImage: Sendable {
    let data: Data
    let mimeType: String
    let pixelWidth: Int
    let pixelHeight: Int
    let byteCount: Int
}

enum MealPhotoProcessorError: Error, Equatable {
    case encodingFailed
    case hardByteCapExceeded
}

enum MealPhotoProcessor {
    static func prepareForAnalysisAndStorage(_ image: UIImage) throws -> PreparedMealImage {
        let normalized = normalizedImage(image)
        var didEncode = false

        for maxLongEdge in AppConstants.MealPhoto.longEdgeRetrySteps where maxLongEdge >= Double(AppConstants.MealPhoto.minLongEdgePx) {
            for quality in AppConstants.MealPhoto.qualityRetrySteps where quality >= AppConstants.MealPhoto.minJPEGQuality {
                guard let prepared = encode(
                    normalized,
                    maxLongEdge: CGFloat(maxLongEdge),
                    quality: CGFloat(quality)
                ) else {
                    continue
                }

                didEncode = true
                if prepared.byteCount <= AppConstants.MealPhoto.hardMaxBytes {
                    logSoftMaxExceededIfNeeded(prepared)
                    return prepared
                }
            }
        }

        if !didEncode {
            throw MealPhotoProcessorError.encodingFailed
        }
        throw MealPhotoProcessorError.hardByteCapExceeded
    }

    static func prepared(fromPersistedJPEG data: Data) -> PreparedMealImage? {
        guard let image = UIImage(data: data), let cgImage = image.cgImage else {
            return nil
        }

        return PreparedMealImage(
            data: data,
            mimeType: AppConstants.MealPhoto.outputMIMEType,
            pixelWidth: cgImage.width,
            pixelHeight: cgImage.height,
            byteCount: data.count
        )
    }

    /// Wraps stored bytes for edit/save without re-encoding. Preserves opaque data when UIImage cannot decode.
    static func preparedPreservingBytes(from data: Data) -> PreparedMealImage {
        if let prepared = prepared(fromPersistedJPEG: data) {
            return prepared
        }

        return PreparedMealImage(
            data: data,
            mimeType: AppConstants.MealPhoto.outputMIMEType,
            pixelWidth: 0,
            pixelHeight: 0,
            byteCount: data.count
        )
    }

    private static func encode(
        _ image: UIImage,
        maxLongEdge: CGFloat,
        quality: CGFloat
    ) -> PreparedMealImage? {
        let resized = resizedImage(image, maxLongEdge: maxLongEdge)
        guard let cgImage = resized.cgImage,
              let data = resized.jpegData(compressionQuality: quality) else {
            return nil
        }

        return PreparedMealImage(
            data: data,
            mimeType: AppConstants.MealPhoto.outputMIMEType,
            pixelWidth: cgImage.width,
            pixelHeight: cgImage.height,
            byteCount: data.count
        )
    }

    private static func normalizedImage(_ image: UIImage) -> UIImage {
        guard image.imageOrientation != .up else { return image }

        let format = rendererFormat()
        return UIGraphicsImageRenderer(size: image.size, format: format).image { _ in
            image.draw(in: CGRect(origin: .zero, size: image.size))
        }
    }

    private static func resizedImage(_ image: UIImage, maxLongEdge: CGFloat) -> UIImage {
        guard let cgImage = image.cgImage else { return image }

        let pixelWidth = CGFloat(cgImage.width)
        let pixelHeight = CGFloat(cgImage.height)
        let longEdge = max(pixelWidth, pixelHeight)

        guard longEdge > maxLongEdge else { return image }

        let scale = maxLongEdge / longEdge
        let targetSize = CGSize(width: pixelWidth * scale, height: pixelHeight * scale)
        let format = rendererFormat()

        return UIGraphicsImageRenderer(size: targetSize, format: format).image { _ in
            image.draw(in: CGRect(origin: .zero, size: targetSize))
        }
    }

    private static func rendererFormat() -> UIGraphicsImageRendererFormat {
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        return format
    }

    private static func logSoftMaxExceededIfNeeded(_ prepared: PreparedMealImage) {
        #if DEBUG
        if prepared.byteCount > AppConstants.MealPhoto.softMaxBytes {
            print(
                "MealPhotoProcessor: prepared photo \(prepared.byteCount) bytes exceeds soft max \(AppConstants.MealPhoto.softMaxBytes)"
            )
        }
        #endif
    }
}
