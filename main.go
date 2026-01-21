package main

import (
	"fmt"
	"math"
)

func main() {
	// Create a massive beautiful 3D M with shading and depth
	height := 60
	width := 120

	// Color codes for beautiful gradient effect
	colors := []string{
		"\033[38;5;196m", // Bright red
		"\033[38;5;202m", // Orange-red
		"\033[38;5;208m", // Orange
		"\033[38;5;214m", // Yellow-orange
		"\033[38;5;220m", // Yellow
		"\033[38;5;226m", // Bright yellow
		"\033[38;5;190m", // Yellow-green
		"\033[38;5;154m", // Light green
	}
	reset := "\033[0m"

	fmt.Println("\n" + colors[5] + "╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗" + reset)
	fmt.Println(colors[5] + "║                                    MAGNIFICENT 3D M PATTERN                                                      ║" + reset)
	fmt.Println(colors[5] + "╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝" + reset)
	fmt.Println()

	for row := 0; row < height; row++ {
		for col := 0; col < width; col++ {
			// Calculate distance from edges for 3D depth effect
			// distFromLeft := float64(col)
			// distFromRight := float64(width - col)
			// distFromTop := float64(row)

			// Left pillar of M with thickness and 3D depth
			leftPillar := col >= 0 && col <= 8
			leftPillarDepth := col

			// Right pillar of M with thickness and 3D depth
			rightPillar := col >= width-9 && col <= width-1
			rightPillarDepth := width - col - 1

			// Left diagonal with thickness (top-left to center)
			leftDiagStart := 8
			leftDiagSlope := float64(row) * 0.8
			leftDiagonal := col >= int(leftDiagSlope)+leftDiagStart-4 &&
			                col <= int(leftDiagSlope)+leftDiagStart+4 &&
			                row < height/2
			leftDiagDepth := int(math.Abs(float64(col) - (leftDiagSlope + float64(leftDiagStart))))

			// Right diagonal with thickness (top-right to center)
			rightDiagStart := width - 9
			rightDiagSlope := float64(row) * 0.8
			rightDiagonal := col >= int(float64(rightDiagStart)-rightDiagSlope)-4 &&
			                 col <= int(float64(rightDiagStart)-rightDiagSlope)+4 &&
			                 row < height/2
			rightDiagDepth := int(math.Abs(float64(col) - (float64(rightDiagStart) - rightDiagSlope)))

			// Create beautiful 3D shading
			char := " "
			colorIndex := 0

			if leftPillar {
				// Left pillar with depth shading
				colorIndex = leftPillarDepth % len(colors)
				if row%2 == 0 {
					char = "█"
				} else {
					char = "▓"
				}
				if leftPillarDepth < 3 {
					char = "█"
				} else if leftPillarDepth < 6 {
					char = "▓"
				}
			} else if rightPillar {
				// Right pillar with depth shading
				colorIndex = rightPillarDepth % len(colors)
				if row%2 == 0 {
					char = "█"
				} else {
					char = "▓"
				}
				if rightPillarDepth < 3 {
					char = "█"
				} else if rightPillarDepth < 6 {
					char = "▓"
				}
			} else if leftDiagonal {
				// Left diagonal with gradient
				colorIndex = (leftDiagDepth + row/5) % len(colors)
				if leftDiagDepth == 0 {
					char = "█"
				} else if leftDiagDepth <= 2 {
					char = "▓"
				} else {
					char = "▒"
				}
			} else if rightDiagonal {
				// Right diagonal with gradient
				colorIndex = (rightDiagDepth + row/5) % len(colors)
				if rightDiagDepth == 0 {
					char = "█"
				} else if rightDiagDepth <= 2 {
					char = "▓"
				} else {
					char = "▒"
				}
			}

			// Add some sparkle effects at intersections
			if (leftPillar || rightPillar || leftDiagonal || rightDiagonal) && row%7 == col%7 {
				fmt.Print(colors[5] + "✦" + reset)
			} else if char != " " {
				fmt.Print(colors[colorIndex] + char + reset)
			} else {
				// Add subtle background pattern
				if row%3 == 0 && col%6 == 0 {
					fmt.Print("\033[38;5;236m·\033[0m")
				} else {
					fmt.Print(" ")
				}
			}
		}
		fmt.Println()
	}

	// Bottom decoration
	fmt.Println()
	fmt.Println(colors[5] + "╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗" + reset)
	fmt.Println(colors[5] + "║" + reset + colors[3] + "  Made with 1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111  " + reset + colors[5] + "║" + reset)
	fmt.Println(colors[5] + "║" + reset + colors[2] + "  1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111  " + reset + colors[5] + "║" + reset)
	fmt.Println(colors[5] + "║" + reset + colors[1] + "  1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111  " + reset + colors[5] + "║" + reset)
	fmt.Println(colors[5] + "╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝" + reset)

	// ASCII art style M made of 1's
	fmt.Println()
	fmt.Println(colors[6] + "                          ████████╗    ████████╗" + reset)
	fmt.Println(colors[5] + "                          ███╔═══██║  ██╔═══███║" + reset)
	fmt.Println(colors[4] + "                          ███║   ╚██████╔   ███║" + reset)
	fmt.Println(colors[3] + "                          ███║    ╚════╝    ███║" + reset)
	fmt.Println(colors[2] + "                          ███║             ███║" + reset)
	fmt.Println(colors[1] + "                          ███║             ███║" + reset)
	fmt.Println(colors[0] + "                          ████████╗     ████████╗" + reset)

	// Giant 1's pattern
	fmt.Println()
	fmt.Println(colors[5] + "111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111" + reset)
	fmt.Println(colors[4] + "111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111" + reset)
	fmt.Println(colors[3] + "111  111  111  111  111  111  111  111  111  111  111  111  111  111  111  111  111  111  111  111  111  111" + reset)
	fmt.Println(colors[2] + "111  111  111  111  111  111  111  111  111  111  111  111  111  111  111  111  111  111  111  111  111  111" + reset)
	fmt.Println(colors[1] + "111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111" + reset)
	fmt.Println(colors[0] + "111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111" + reset)

	// More decorative 1's in different patterns
	fmt.Println()
	for i := 0; i < 15; i++ {
		colorIdx := i % len(colors)
		for j := 0; j < 110; j++ {
			if j%(i+1) == 0 {
				fmt.Print(colors[colorIdx] + "1" + reset)
			} else {
				fmt.Print(colors[(colorIdx+1)%len(colors)] + "1" + reset)
			}
		}
		fmt.Println()
	}



	// Create a wave pattern with 1's
	fmt.Println()
	for wave := 0; wave < 10; wave++ {
		for pos := 0; pos < 100; pos++ {
			waveHeight := int(15 * (math.Sin(float64(pos)/5.0+float64(wave)) + 1))
			if pos%2 == wave%2 {
				fmt.Print(colors[waveHeight%len(colors)] + "1" + reset)
			} else {
				fmt.Print(colors[(waveHeight+1)%len(colors)] + "1" + reset)
			}
		}
		fmt.Println()
	}

	// Spiral pattern with 1's
	fmt.Println()
	fmt.Println(colors[5] + "╔══════════════════════════════ SPIRAL OF 1's ══════════════════════════════╗" + reset)
	size := 30
	spiral := make([][]string, size)
	for i := range spiral {
		spiral[i] = make([]string, size)
		for j := range spiral[i] {
			spiral[i][j] = "  "
		}
	}

	x, y := size/2, size/2
	dx, dy := 0, -1
	for i := 0; i < size*size; i++ {
		if (-size/2 < x) && (x <= size/2) && (-size/2 < y) && (y <= size/2) {
			spiral[y+size/2][x+size/2] = colors[i%len(colors)] + "1" + reset + " "
		}
		if x == y || (x < 0 && x == -y) || (x > 0 && x == 1-y) {
			dx, dy = -dy, dx
		}
		x, y = x+dx, y+dy
	}

	for i := range spiral {
		fmt.Print("     ")
		for j := range spiral[i] {
			fmt.Print(spiral[i][j])
		}
		fmt.Println()
	}

	// Diamond pattern with 1's
	fmt.Println()
	fmt.Println(colors[5] + "╔══════════════════════════════ DIAMOND OF 1's ══════════════════════════════╗" + reset)
	diamondSize := 20
	for i := 0; i < diamondSize; i++ {
		spaces := int(math.Abs(float64(diamondSize/2 - i)))
		ones := diamondSize - spaces*2

		fmt.Print("     ")
		for s := 0; s < spaces; s++ {
			fmt.Print(" ")
		}
		colorIdx := i % len(colors)
		for o := 0; o < ones; o++ {
			if o%2 == 0 {
				fmt.Print(colors[colorIdx] + "1 " + reset)
			} else {
				fmt.Print(colors[(colorIdx+1)%len(colors)] + "1 " + reset)
			}
		}
		fmt.Println()
	}

	// Checkerboard pattern
	fmt.Println()
	fmt.Println(colors[5] + "╔══════════════════════════════ CHECKERBOARD OF 1's ══════════════════════════════╗" + reset)
	for i := 0; i < 15; i++ {
		fmt.Print("     ")
		for j := 0; j < 50; j++ {
			if (i+j)%2 == 0 {
				fmt.Print(colors[i%len(colors)] + "11" + reset)
			} else {
				fmt.Print(colors[(i+1)%len(colors)] + "11" + reset)
			}
		}
		fmt.Println()
	}

	// Final massive 1's display
	fmt.Println()
	fmt.Println(colors[5] + "╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗" + reset)
	fmt.Println(colors[5] + "║                                    MASSIVE 1's FINALE                                                             ║" + reset)
	fmt.Println(colors[5] + "╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝" + reset)

	for line := 0; line < 30; line++ {
		colorIdx := line % len(colors)
		for col := 0; col < 110; col++ {
			intensity := int((math.Sin(float64(col)/3.0+float64(line)/2.0) + 1) * 3.5)
			switch intensity % 4 {
			case 0:
				fmt.Print(colors[colorIdx] + "1" + reset)
			case 1:
				fmt.Print(colors[(colorIdx+1)%len(colors)] + "1" + reset)
			case 2:
				fmt.Print(colors[(colorIdx+2)%len(colors)] + "1" + reset)
			default:
				fmt.Print(colors[(colorIdx+3)%len(colors)] + "1" + reset)
			}
		}
		fmt.Println()
	}

	// Grand finale
	fmt.Println()
	fmt.Println(colors[5] + "═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════" + reset)
	fmt.Println(colors[4] + "           ██╗    ██╗ ██╗    ██╗ ██╗    ██╗ ██╗    ██╗ ██╗    ██╗ ██╗    ██╗ ██╗    ██╗" + reset)
	fmt.Println(colors[3] + "          ████║  ████║████║  ████║████║  ████║████║  ████║████║  ████║████║  ████║████║  ████║" + reset)
	fmt.Println(colors[2] + "         ██╔═██╗██╔═██╗██╔═██╗██╔═██╗██╔═██╗██╔═██╗██╔═██╗██╔═██╗██╔═██╗██╔═██╗██╔═██╗██╔═██╗" + reset)
	fmt.Println(colors[1] + "        ██║  ████║  ████║  ████║  ████║  ████║  ████║  ████║  ████║  ████║  ████║  ████║  ████║" + reset)
	fmt.Println(colors[0] + "═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════" + reset)

	fmt.Println()
	fmt.Println(colors[5] + "                                    ✨ MAGNIFICENT M ✨" + reset)
	fmt.Println()
}
