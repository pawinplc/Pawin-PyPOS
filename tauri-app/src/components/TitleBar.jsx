import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

const TitleBar = () => {
    const [isMaximized, setIsMaximized] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const appWindow = getCurrentWindow();

    useEffect(() => {
        const checkMaximized = async () => {
            const maximized = await appWindow.isMaximized();
            setIsMaximized(maximized);
        };
        
        checkMaximized();
        
        const unlistenResize = appWindow.onResized(() => {
            checkMaximized();
        });

        // Intercept Alt+F4 or system close requests
        const unlistenClose = appWindow.onCloseRequested(async (event) => {
            event.preventDefault(); // Stop native close
            setShowConfirm(true);    // Show our custom modal
        });

        return () => {
            unlistenResize.then(fn => fn());
            unlistenClose.then(fn => fn());
        };
    }, []);

    const handleMinimize = () => appWindow.minimize();
    const handleMaximize = async () => {
        await appWindow.toggleMaximize();
        setIsMaximized(await appWindow.isMaximized());
    };
    
    const handleCloseAttempt = () => {
        setShowConfirm(true);
    };

    const confirmClose = () => appWindow.destroy();
    const cancelClose = () => setShowConfirm(false);

    return (
        <>
            <div data-tauri-drag-region className="custom-titlebar">
                <div className="titlebar-info">
                    <img src="/icons/32x32.png" alt="Logo" className="titlebar-logo" />
                    <span className="titlebar-text">Pawin PyPOS</span>
                </div>
                
                <div className="titlebar-actions">
                    <button className="titlebar-button minimize" onClick={handleMinimize} title="Minimize">
                        <svg width="12" height="12" viewBox="0 0 12 12"><rect fill="currentColor" width="10" height="1" x="1" y="6"/></svg>
                    </button>
                    <button className="titlebar-button maximize" onClick={handleMaximize} title={isMaximized ? "Restore" : "Maximize"}>
                        {isMaximized ? (
                            <svg width="12" height="12" viewBox="0 0 12 12"><path fill="currentColor" d="M3,1 L9,1 C9.55,1 10,1.45 10,2 L10,8 C10,8.55 9.55,9 9,9 L3,9 C2.45,9 2,8.55 2,8 L2,2 C2,1.45 2.45,1 3,1 Z M3,2 L3,8 L9,8 L9,2 L3,2 Z M11,3 L11,10 C11,10.55 10.55,11 10,11 L3,11 L3,10 L10,10 L10,3 L11,3 Z"/></svg>
                        ) : (
                            <svg width="12" height="12" viewBox="0 0 12 12"><rect fill="none" stroke="currentColor" strokeWidth="1" width="9" height="9" x="1.5" y="1.5"/></svg>
                        )}
                    </button>
                    <button className="titlebar-button close" onClick={handleCloseAttempt} title="Close">
                        <svg width="12" height="12" viewBox="0 0 12 12"><path fill="currentColor" d="M1.5,1.5 L10.5,10.5 M10.5,1.5 L1.5,10.5" stroke="currentColor" strokeWidth="1.5"/></svg>
                    </button>
                </div>
            </div>

            {showConfirm && (
                <div className="close-confirm-overlay">
                    <div className="close-confirm-modal">
                        <div className="confirm-icon">
                            <i className="ti ti-door-exit"></i>
                        </div>
                        <h3>Exit Application?</h3>
                        <p>Are you sure you want to close Pawin PyPOS? Unsaved transaction progress may be lost.</p>
                        <div className="confirm-buttons">
                            <button className="btn-cancel" onClick={cancelClose}>Stay</button>
                            <button className="btn-confirm" onClick={confirmClose}>Exit Now</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TitleBar;
