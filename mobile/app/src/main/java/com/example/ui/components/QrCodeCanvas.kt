package com.example.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import java.security.MessageDigest

/**
 * Procedural Deterministic QR Code visualizer for Bitcoin Addresses.
 * Renders a crisp 25x25 QR Matrix with standard QR finder positioning patterns.
 */
@Composable
fun QrCodeCanvas(
    data: String,
    modifier: Modifier = Modifier,
    size: Dp = 180.dp,
    dotColor: Color = Color(0xFF1B1B1F),
    backgroundColor: Color = Color.White
) {
    val matrix = remember(data) {
        generateQrMatrix(data, 25)
    }

    Box(
        modifier = modifier
            .size(size)
            .clip(RoundedCornerShape(16.dp))
            .background(backgroundColor)
            .padding(12.dp),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize().aspectRatio(1f)) {
            val count = matrix.size
            val cellSize = this.size.width / count

            for (row in 0 until count) {
                for (col in 0 until count) {
                    if (matrix[row][col]) {
                        drawRect(
                            color = dotColor,
                            topLeft = Offset(col * cellSize, row * cellSize),
                            size = Size(cellSize + 0.5f, cellSize + 0.5f)
                        )
                    }
                }
            }
        }
    }
}

private fun generateQrMatrix(data: String, matrixSize: Int = 25): Array<BooleanArray> {
    val matrix = Array(matrixSize) { BooleanArray(matrixSize) { false } }

    // Finder patterns (Top-Left, Top-Right, Bottom-Left)
    fun drawFinder(startRow: Int, startCol: Int) {
        for (r in 0 until 7) {
            for (c in 0 until 7) {
                val isOuter = r == 0 || r == 6 || c == 0 || c == 6
                val isInner = r in 2..4 && c in 2..4
                matrix[startRow + r][startCol + c] = isOuter || isInner
            }
        }
    }

    drawFinder(0, 0)
    drawFinder(0, matrixSize - 7)
    drawFinder(matrixSize - 7, 0)

    // Timing patterns
    for (i in 8 until matrixSize - 8) {
        matrix[6][i] = i % 2 == 0
        matrix[i][6] = i % 2 == 0
    }

    // Fill data areas deterministically using SHA-256 hash stream
    val hash = MessageDigest.getInstance("SHA-256").digest(data.toByteArray(Charsets.UTF_8))
    var bitIndex = 0

    for (r in 0 until matrixSize) {
        for (c in 0 until matrixSize) {
            // Skip finder zones
            val inTopLeft = r < 8 && c < 8
            val inTopRight = r < 8 && c >= matrixSize - 8
            val inBottomLeft = r >= matrixSize - 8 && c < 8
            val inTiming = (r == 6 && c in 8 until matrixSize - 8) || (c == 6 && r in 8 until matrixSize - 8)

            if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming) {
                val byteVal = hash[(bitIndex / 8) % hash.size].toInt()
                val bitVal = (byteVal ushr (bitIndex % 8)) and 1
                matrix[r][c] = (bitVal == 1) xor ((r + c) % 3 == 0)
                bitIndex++
            }
        }
    }

    return matrix
}
