import SwiftUI

/// One choice of an option grid.
struct OptionCell {
    let label: String
    let on: Bool
    let action: () -> Void
}

/// The web's option grid under a View row (`optGrid`, `optCell`, `panelWrap` in src/app.jsx): cells 44 tall in a grid whose 1pt
/// gaps show the line colour, the picked one filled with the accent. The last cell of an unfinished row spans what is left of
/// it, as the web's By month and its last sort do. `extra` holds a sub row of its own, such as the Last stepper.
struct OptionPanel<Extra: View>: View {
    let id: String
    let columns: Int
    let cells: [OptionCell]
    @ViewBuilder var extra: Extra

    private var rows: [[OptionCell]] {
        stride(from: 0, to: cells.count, by: columns).map { Array(cells[$0..<min($0 + columns, cells.count)]) }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Grid(horizontalSpacing: 1, verticalSpacing: 1) {
                ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                    GridRow {
                        ForEach(Array(row.enumerated()), id: \.offset) { i, cell in
                            let last = i == row.count - 1
                            button(cell).gridCellColumns(last ? columns - row.count + 1 : 1)
                        }
                    }
                }
            }
            .background(Parchment.line)
            .overlay(Rectangle().strokeBorder(Parchment.line, lineWidth: 1))
            .padding(.top, 8)
            .accessibilityElement(children: .contain)
            .accessibilityIdentifier(id)
            extra
        }
        .padding(.horizontal, 8).padding(.top, 4).padding(.bottom, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(alignment: .top) { Rectangle().fill(Parchment.line).frame(height: 1) }
    }

    private func button(_ cell: OptionCell) -> some View {
        Button(action: cell.action) {
            Text(cell.label).font(.mono(11.5, relativeTo: .caption)).lineLimit(1).minimumScaleFactor(0.8)
                .foregroundStyle(cell.on ? Parchment.card : Parchment.ink)
                .frame(maxWidth: .infinity, minHeight: 44)
                .background(cell.on ? Parchment.accent : Parchment.card)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(cell.on ? .isSelected : [])
    }
}

extension OptionPanel where Extra == EmptyView {
    init(id: String, columns: Int, cells: [OptionCell]) {
        self.init(id: id, columns: columns, cells: cells) { EmptyView() }
    }
}
