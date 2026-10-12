// Mirror scan for secrets (the-token-is-a-credential, lane N2). A test points it at a
// value that must never hold a key: view state, the ledger, a backup. It walks every
// child, and it reads String, Data and URL leaves as text. Classes are visited once.

import Foundation

/// True when `needle` appears in any String, Data or URL reachable from `value`.
func mirrorFinds(_ needle: String, in value: Any) -> Bool {
    var seen = Set<ObjectIdentifier>()
    return walk(needle, value, &seen, depth: 0)
}

private func walk(_ needle: String, _ value: Any, _ seen: inout Set<ObjectIdentifier>, depth: Int) -> Bool {
    if depth > 64 { return false }
    if let text = value as? String { return text.contains(needle) }
    if let data = value as? Data { return String(decoding: data, as: UTF8.self).contains(needle) }
    if let url = value as? URL { return url.absoluteString.contains(needle) }
    let mirror = Mirror(reflecting: value)
    if mirror.displayStyle == .class {
        guard seen.insert(ObjectIdentifier(value as AnyObject)).inserted else { return false }
    }
    for child in mirror.children {
        if walk(needle, child.value, &seen, depth: depth + 1) { return true }
    }
    return false
}
