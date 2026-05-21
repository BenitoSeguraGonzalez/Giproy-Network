try:
    import sys
    import os
    sys.path.append(os.path.join(os.getcwd(), 'backend'))
    from app.repositories.dispositivo import DispositivoRepository
    import inspect
    sig = inspect.signature(DispositivoRepository.__init__)
    print(f"DispositivoRepository.__init__ signature: {sig}")
except Exception as e:
    print(f"Error: {e}")
