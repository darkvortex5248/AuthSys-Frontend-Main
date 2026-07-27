package authsys

import (
	"crypto/md5"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"
)

func GetHwid() string {
	try := func() string {
		if runtime.GOOS == "windows" {
			cmd := exec.Command("wmic", "csproduct", "get", "uuid")
			output, err := cmd.Output()
			if err == nil {
				lines := strings.Split(string(output), "\n")
				for _, line := range lines {
					line = strings.TrimSpace(line)
					if len(line) > 0 && line != "UUID" {
						return line
					}
				}
			}
		} else if runtime.GOOS == "linux" {
			if data, err := os.ReadFile("/etc/machine-id"); err == nil {
				return strings.TrimSpace(string(data))
			}
			if data, err := os.ReadFile("/proc/sys/kernel/random/boot_id"); err == nil {
				return strings.TrimSpace(string(data))
			}
		} else if runtime.GOOS == "darwin" {
			cmd := exec.Command("ioreg", "-rd1", "-c", "IOPlatformExpertDevice")
			output, err := cmd.Output()
			if err == nil {
				lines := strings.Split(string(output), "\n")
				for _, line := range lines {
					if strings.Contains(line, "IOPlatformUUID") {
						parts := strings.Split(line, "\"")
						if len(parts) >= 4 {
							return parts[3]
						}
					}
				}
			}
		}
		return ""
	}

	if hwid := try(); hwid != "" {
		return hwid
	}
	return "UNKNOWN_HWID"
}

func HashString(input string) string {
	h := sha256.New()
	h.Write([]byte(input))
	return hex.EncodeToString(h.Sum(nil))
}

func HashMd5(input string) string {
	h := md5.New()
	h.Write([]byte(input))
	return hex.EncodeToString(h.Sum(nil))
}

func GenerateGuid() string {
	return fmt.Sprintf("%x-%x-%x-%x-%x", 
		byteSlice(0), byteSlice(1), byteSlice(2), byteSlice(3), byteSlice(4))
}

func byteSlice(n int) []byte {
	b := make([]byte, 16)
	for i := range b {
		b[i] = byte(i + n)
	}
	return b
}

func IsWindows() bool {
	return runtime.GOOS == "windows"
}

func IsLinux() bool {
	return runtime.GOOS == "linux"
}

func IsMacOS() bool {
	return runtime.GOOS == "darwin"
}
