// Draws the app icon: the site's "b." mark on a dark rounded square.
// Usage: swift icon.swift <output-folder.iconset>
import Cocoa

let out = CommandLine.arguments[1]
try? FileManager.default.createDirectory(atPath: out, withIntermediateDirectories: true)

func draw(_ size: CGFloat) -> Data {
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(size), pixelsHigh: Int(size),
                               bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
                               colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    let inset = size * 0.1
    let rect = NSRect(x: inset, y: inset, width: size - inset * 2, height: size - inset * 2)
    let path = NSBezierPath(roundedRect: rect, xRadius: rect.width * 0.225, yRadius: rect.width * 0.225)
    NSGradient(colors: [NSColor(red: 0.10, green: 0.27, blue: 0.25, alpha: 1),
                        NSColor(red: 0.04, green: 0.055, blue: 0.075, alpha: 1),
                        NSColor(red: 0.29, green: 0.21, blue: 0.11, alpha: 1)])!.draw(in: path, angle: -45)
    NSColor(white: 1, alpha: 0.12).setStroke()
    path.lineWidth = max(1, size * 0.006)
    path.stroke()
    let font = NSFont(name: "Georgia-Bold", size: rect.width * 0.62) ?? NSFont.boldSystemFont(ofSize: rect.width * 0.62)
    let b = NSAttributedString(string: "b", attributes: [.font: font, .foregroundColor: NSColor(red: 0.95, green: 0.945, blue: 0.925, alpha: 1)])
    let bs = b.size()
    let bx = rect.midX - bs.width * 0.62
    let by = rect.midY - bs.height * 0.5
    b.draw(at: NSPoint(x: bx, y: by))
    let d = rect.width * 0.12
    let dot = NSRect(x: bx + bs.width + d * 0.15, y: by + bs.height * 0.2, width: d, height: d)
    NSColor(red: 0.847, green: 0.706, blue: 0.478, alpha: 1).setFill()
    NSBezierPath(ovalIn: dot).fill()
    NSGraphicsContext.restoreGraphicsState()
    return rep.representation(using: .png, properties: [:])!
}

for (name, px) in [("16x16", 16), ("16x16@2x", 32), ("32x32", 32), ("32x32@2x", 64), ("128x128", 128),
                   ("128x128@2x", 256), ("256x256", 256), ("256x256@2x", 512), ("512x512", 512), ("512x512@2x", 1024)] {
    try! draw(CGFloat(px)).write(to: URL(fileURLWithPath: "\(out)/icon_\(name).png"))
}
