import UIKit
import XCTest
@testable import CalSnap

final class MealPhotoProcessorTests: XCTestCase {
    private func rendererFormat() -> UIGraphicsImageRendererFormat {
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        return format
    }

    private func solidImage(size: CGSize, color: UIColor = .red) -> UIImage {
        UIGraphicsImageRenderer(size: size, format: rendererFormat()).image { context in
            color.setFill()
            context.fill(CGRect(origin: .zero, size: size))
        }
    }

    private func noisyImage(size: CGSize) -> UIImage {
        UIGraphicsImageRenderer(size: size, format: rendererFormat()).image { context in
            for x in stride(from: 0, to: Int(size.width), by: 4) {
                for y in stride(from: 0, to: Int(size.height), by: 4) {
                    let hue = CGFloat((x * 17 + y * 31) % 256) / 255
                    UIColor(hue: hue, saturation: 1, brightness: 1, alpha: 1).setFill()
                    context.fill(CGRect(x: x, y: y, width: 4, height: 4))
                }
            }
        }
    }

    func testPrepareMealPhotoNormalizesOrientation() throws {
        let upright = solidImage(size: CGSize(width: 400, height: 200))
        guard let cgImage = upright.cgImage else {
            XCTFail("Expected CGImage")
            return
        }

        let rotated = UIImage(cgImage: cgImage, scale: 1, orientation: .right)
        let prepared = try MealPhotoProcessor.prepareForAnalysisAndStorage(rotated)
        let decoded = UIImage(data: prepared.data)

        XCTAssertEqual(decoded?.imageOrientation, .up)
        XCTAssertEqual(prepared.pixelWidth, 200)
        XCTAssertEqual(prepared.pixelHeight, 400)
    }

    func testPrepareMealPhotoDownsamplesLargeImage() throws {
        let large = solidImage(size: CGSize(width: 4000, height: 3000))
        let prepared = try MealPhotoProcessor.prepareForAnalysisAndStorage(large)

        XCTAssertLessThanOrEqual(
            max(prepared.pixelWidth, prepared.pixelHeight),
            AppConstants.MealPhoto.maxLongEdgePx
        )
    }

    func testPrepareMealPhotoUsesJPEGMimeType() throws {
        let image = solidImage(size: CGSize(width: 320, height: 240))
        let prepared = try MealPhotoProcessor.prepareForAnalysisAndStorage(image)

        XCTAssertEqual(prepared.mimeType, AppConstants.MealPhoto.outputMIMEType)
    }

    func testPrepareMealPhotoEnforcesHardByteCeiling() throws {
        let noisy = noisyImage(size: CGSize(width: 3500, height: 3500))
        let prepared = try MealPhotoProcessor.prepareForAnalysisAndStorage(noisy)

        XCTAssertLessThanOrEqual(prepared.byteCount, AppConstants.MealPhoto.hardMaxBytes)
    }

    func testPrepareMealPhotoDoesNotUpscaleOrBloatSmallImage() throws {
        let small = solidImage(size: CGSize(width: 200, height: 200))
        let prepared = try MealPhotoProcessor.prepareForAnalysisAndStorage(small)

        XCTAssertEqual(prepared.pixelWidth, 200)
        XCTAssertEqual(prepared.pixelHeight, 200)
        XCTAssertLessThan(prepared.byteCount, 50_000)
    }

    func testPrepareMealPhotoEncodingFailedForEmptyImage() {
        XCTAssertThrowsError(try MealPhotoProcessor.prepareForAnalysisAndStorage(UIImage())) { error in
            XCTAssertEqual(error as? MealPhotoProcessorError, .encodingFailed)
        }
    }
}
