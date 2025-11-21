# BoonsKioskM2 - Android Run Walkthrough

## Summary
Successfully built and launched the **BoonsKioskM2** application on the Android emulator (`Medium_Phone_API_35`).

## Steps Taken
1.  **Environment Check:**
    *   Verified Android emulator `Medium_Phone_API_35` availability.
    *   Installed dependencies via `npm install`.
2.  **Build Fixes:**
    *   Encountered `NullPointerException` in R8/D8 during build with Java 23.
    *   **Resolution:** Switched to **Java 17** (`/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home`) which is compatible with the project's Gradle/AGP version.
3.  **Execution:**
    *   Launched Android Emulator.
    *   Started Metro Bundler (`npx react-native start`).
    *   Built and installed the app (`npx react-native run-android`).

## Verification
*   **Build Status:** SUCCESS
*   **App Status:** Installed and launched on emulator.
*   **Screenshot:**
    ![Emulator Screenshot](/Users/sanjivankumar/.gemini/antigravity/brain/bb0081b2-c656-4ee3-884f-1cd51938d2a8/emulator_screenshot_tablet_restored.png)
*   **Logs:**
    ```
    > Task :app:installDebug
    Installing APK 'app-debug.apk' on 'Medium_Phone_API_35(AVD) - 15' for :app:debug
    Installed on 1 device.
    Starting: Intent { cmp=com.temprnapp/.MainActivity }
    ```

## Next Steps
*   The app should now be visible on the emulator.
*   Verify the Kiosk WebView loads the configured URL.
*   Test Stripe Terminal integration (requires physical device or simulated reader).
