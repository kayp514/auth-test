  // Event Handlers
{/*  const createEventHandlers = useCallback((socketInstance: Socket): SocketEventHandlers => ({
    onConnect: () => {
      console.log("Socket connected with ID:", socketInstance.id)
      setState((prev: SocketCtxState) => ({
        ...prev,
        isConnected: true,
        connectionError: null,
        socketId: socketInstance.id ?? null
      }))
    },

    onDisconnect: (reason: string) => {
      console.log("Socket disconnected:", reason)
      setState(prev => ({
        ...prev,
        isConnected: false,
        socketId: null
      }))
    },

    onSession: ({ sessionId }: { sessionId: string }) => {
      console.log("Received session ID:", sessionId)
      
      // Store the sessionId in configured storage
      storeSessionId(sessionId, configRef.current);
      
      // Update socket auth for reconnections
      if (socketInstance.auth) {
        socketInstance.auth = {
          ...socketInstance.auth,
          sessionId
        };
      }
      
      // Update state with the new sessionId
      setState(prev => ({
        ...prev,
        sessionId
      }))
    },

    onConnectError: (error: Error) => {
      console.error("Socket connection error:", error)

      toast.error("Connection error", {
        description: "Failed to connect to the server. Please check your internet connection.",
        duration: 5000,
      })

      setState(prev => ({
        ...prev,
        connectionError: error.message,
        isConnected: false,
        socketId: null
      }))
    },

    onRecentNotification: (data: unknown) => {
      console.log("Recent notifications received:", data)
      if (validateNotificationData(data)) {
        setState(prev => ({
          ...prev,
          notifications: data.notifications
        }))
      }
    },

    onNotification: (notification: Notification) => {
      console.log("New notification received:", notification)
      setState(prev => ({
        ...prev,
        notifications: [...prev.notifications, notification]
      }))
    }, 

    onPresenceEnter: (data: PresenceUpdate) => {
      console.log('Presence enter received:', data)
      if (data.clientId === config.clientId) {
        console.log('Received own presence enter - ignoring');
        return;
      }
      setState(prev => ({
        ...prev,
        presenceState: new Map(prev.presenceState).set(data.clientId, data)
      }))
    },

    onPresenceUpdate: (data: PresenceUpdate) => {
      console.log('Presence update received:', { data, currentClientId: config.clientId });
      setState(prev => ({
        ...prev,
        presenceState: new Map(prev.presenceState).set(data.clientId, data)
      }))
    },

    onPresenceSync: (updates: PresenceUpdate[]) => {
      console.log('Presence sync received:', updates);
      setState(prev => {
        const newPresenceState = new Map();
        updates.forEach(update => {
          newPresenceState.set(update.clientId, update);
        });
        return { ...prev, presenceState: newPresenceState };
      });
    },

    onPresenceLeave: ({ clientId }: { clientId: string }) => {
      console.log('Presence leave:', clientId)
      setState(prev => {
        const newPresenceState = new Map(prev.presenceState)
        newPresenceState.delete(clientId)
        return { ...prev, presenceState: newPresenceState }
      })
    },

  }), []) */}

  // Socket initialization
{/*  useEffect(() => {
    if (connectionAttempted.current) return

    connectionAttempted.current = true


    try {
      const socketInstance = createSocketInstance({ 
        config,
        sessionId: initialSessionId.current 
      })
      const handlers = createEventHandlers(socketInstance)

      socketInstance.on("session", (data) => {
        handlers.onSession(data)


        if (data.serverPublicKey) {
          console.log("Received server public key, setting up encryption");
          setServerPublicKey(data.serverPublicKey)

          const clientPublicKey = generateKeyPair()
          socketInstance.emit('client:publicKey', clientPublicKey)

          console.log('Sent client public key to server')
        } else {
          console.warn('No server public key recieved, encrytion not available');
        }
      })

      socketInstance.on('encrypted', (packet) => {
        const { event, data } = packet

        if (isEncryptionReady()) {
          try {
          const decryptedData = decryptFromServer(data)
          if (decryptedData) {
            console.log(`Received encrypted ${event} event`);

            switch(event) {
              case 'presence:enter': handlers.onPresenceEnter(decryptedData); break;
              case 'presence:update': handlers.onPresenceUpdate(decryptedData); break;
              case 'presence:sync': handlers.onPresenceSync(decryptedData); break;
              case 'presence:leave': handlers.onPresenceLeave(decryptedData); break;
              case 'recent_notification': handlers.onRecentNotification(decryptedData); break;
              case 'notification': handlers.onNotification(decryptedData); break;
              default: console.log(`unhandled encrypted event type: ${event}`);
            }
          } else {
            console.error('Failed to decrypt message');
          }
        } catch (error) {
          console.error('Error processing encrypted message:', error)
        }
      }
      })

      socketInstance.on('encryption:ready', () => {
        console.log('Encryption is ready for use');
        // You might want to set a state variable to track this
        setState(prev => ({
          ...prev,
          encryptionReady: true
        }));
      });

      // Attach event listeners
      socketInstance.on("connect", handlers.onConnect)
      socketInstance.on("disconnect", handlers.onDisconnect)
      socketInstance.on("connect_error", handlers.onConnectError)

      socketInstance.on("presence:enter", handlers.onPresenceEnter)
      socketInstance.on("presence:update", handlers.onPresenceUpdate)
      socketInstance.on("presence:sync", handlers.onPresenceSync)
      socketInstance.on("presence:leave", handlers.onPresenceLeave)
      socketInstance.on("recent_notification", handlers.onRecentNotification)
      socketInstance.on("notification", handlers.onNotification)

      setState(prev => ({ ...prev, socket: socketInstance }))

      // Cleanup
      return () => {
        socketInstance.off("connect", handlers.onConnect)
        socketInstance.off("disconnect", handlers.onDisconnect)
        socketInstance.off("session")
        socketInstance.off("connect_error", handlers.onConnectError)
        socketInstance.off("presence:enter", handlers.onPresenceEnter)
        socketInstance.off("presence:update", handlers.onPresenceUpdate)
        socketInstance.off("presence:sync", handlers.onPresenceSync)
        socketInstance.off("presence:leave", handlers.onPresenceLeave)
        socketInstance.off("recent_notification", handlers.onRecentNotification)
        socketInstance.off("notification", handlers.onNotification)
        
        socketInstance.disconnect()
        connectionAttempted.current = false
      }
    } catch (error) {
      //console.error("Socket initialization error:", error)

      toast.error("Connection error", {
        description: "Failed to initialize socket connection. Please try again later.",
        duration: 5000,
      })
      
      setState(prev => ({
        ...prev,
        connectionError: "Failed to initialize socket connection"
      }))
      connectionAttempted.current = false
    }
  }, [createEventHandlers]) */}

{/*  useEffect(() => {
    if (!state.socket) return;

    const socketInstance = createSocketInstance({ 
      config,
      sessionId: initialSessionId.current 
    })

    const handlers = createEventHandlers(socketInstance)
    
    // Get access to the raw WebSocket
    const rawSocket = (state.socket as any).io.engine.transport.ws;
    
    
    if (rawSocket) {
      // Listen for binary messages
      rawSocket.addEventListener('message', (event: MessageEvent) => {
        if (event.data instanceof ArrayBuffer) {
          const message = decryptAndUnpackMessage(config.clientId,event.data);
          if (message) {
            const { event: eventName, data } = message;
            console.log(`Received encrypted binary message for event: ${eventName}`);
            
            // Handle the event based on its type
            switch(eventName) {
              case 'presence:enter': 
                handlers.onPresenceEnter(data); 
                break;
              case 'presence:update': 
                handlers.onPresenceUpdate(data); 
                break;
              case 'presence:sync': 
                handlers.onPresenceSync(data); 
                break;
              case 'presence:leave': 
                handlers.onPresenceLeave(data); 
                break;
              case 'recent_notification': 
                handlers.onRecentNotification(data); 
                break;
              case 'notification': 
                handlers.onNotification(data); 
                break;
            }
          }
        }
      });
    }
    
    // Override the emit method to send binary messages
    const originalEmit = state.socket.emit;
    state.socket.emit = function(event, ...args) {
      // Skip encryption for certain events
      if (['session', 'client:publicKey', 'encryption:ready'].includes(event)) {
        return originalEmit.apply(this, [event, ...args]);
      }
      
      if (isEncryptionReady() && rawSocket && rawSocket.readyState === WebSocket.OPEN) {
        const payload = args[0];
        const binaryData = encryptAndPackMessage(event, payload);
        
        if (binaryData) {
          console.log(`Sending encrypted binary message for event: ${event}`);
          rawSocket.send(binaryData);
          return;
        }
      }
      
      // Fallback to regular Socket.IO
      return originalEmit.apply(this, [event, ...args]);
    };
  }, [state.socket, createEventHandlers]); */}