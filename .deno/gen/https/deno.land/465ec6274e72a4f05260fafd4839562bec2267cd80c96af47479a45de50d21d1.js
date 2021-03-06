const decoder = new TextDecoder();
export const decode = (x)=>decoder.decode(x)
;
export const getNetworkAddr = async ()=>{
    const isWin = Deno.build.os === 'windows';
    const command = isWin ? 'ipconfig' : 'ifconfig';
    try {
        let ifconfig = await Deno.run({
            cmd: [
                command
            ],
            stdout: 'piped'
        });
        const { success  } = await ifconfig.status();
        if (!success) {
            throw new Error(`Subprocess ${command} failed to run`);
        }
        const raw = await ifconfig.output();
        const text = decode(raw);
        if (isWin) {
            const addrs = text.match(new RegExp('ipv4.+([0-9]+.){3}[0-9]+', 'gi'));
            let temp = addrs ? addrs[0].match(new RegExp('([0-9]+.){3}[0-9]+', 'g')) : undefined;
            const addr = temp ? temp[0] : undefined;
            await Deno.close(ifconfig.rid);
            if (!addr) {
                throw new Error('Could not resolve your local adress.');
            }
            return addr;
        } else {
            const addrs = text.match(new RegExp('inet (addr:)?([0-9]*.){3}[0-9]*', 'g'));
            await Deno.close(ifconfig.rid);
            if (!addrs || !addrs.some((x)=>!x.startsWith('inet 127')
            )) {
                throw new Error('Could not resolve your local adress.');
            }
            return addrs && addrs.find((addr)=>!addr.startsWith('inet 127')
            )?.split('inet ')[1];
        }
    } catch (err) {
        console.log(err.message);
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbG9jYWxfaXBAMC4wLjMvbW9kLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGRlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcbmV4cG9ydCBjb25zdCBkZWNvZGUgPSAoeDogVWludDhBcnJheSkgPT4gZGVjb2Rlci5kZWNvZGUoeCk7XG5cbmV4cG9ydCBjb25zdCBnZXROZXR3b3JrQWRkciA9IGFzeW5jICgpID0+IHtcbiAgY29uc3QgaXNXaW4gPSBEZW5vLmJ1aWxkLm9zID09PSAnd2luZG93cyc7XG4gIGNvbnN0IGNvbW1hbmQgPSBpc1dpbiA/ICdpcGNvbmZpZycgOiAnaWZjb25maWcnO1xuICB0cnkge1xuICAgIGxldCBpZmNvbmZpZyA9IGF3YWl0IERlbm8ucnVuKHtcbiAgICAgIGNtZDogW2NvbW1hbmRdLFxuICAgICAgc3Rkb3V0OiAncGlwZWQnLFxuICAgIH0pO1xuXG4gICAgY29uc3QgeyBzdWNjZXNzIH0gPSBhd2FpdCBpZmNvbmZpZy5zdGF0dXMoKTtcbiAgICBpZiAoIXN1Y2Nlc3MpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgU3VicHJvY2VzcyAke2NvbW1hbmR9IGZhaWxlZCB0byBydW5gKTtcbiAgICB9XG5cbiAgICBjb25zdCByYXcgPSBhd2FpdCBpZmNvbmZpZy5vdXRwdXQoKTtcbiAgICBjb25zdCB0ZXh0ID0gZGVjb2RlKHJhdyk7XG5cbiAgICBpZiAoaXNXaW4pIHtcbiAgICAgIGNvbnN0IGFkZHJzID0gdGV4dC5tYXRjaChuZXcgUmVnRXhwKCdpcHY0LisoWzAtOV0rLil7M31bMC05XSsnLCAnZ2knKSk7XG4gICAgICBsZXQgdGVtcCA9IGFkZHJzXG4gICAgICAgID8gYWRkcnNbMF0ubWF0Y2gobmV3IFJlZ0V4cCgnKFswLTldKy4pezN9WzAtOV0rJywgJ2cnKSlcbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgICBjb25zdCBhZGRyID0gdGVtcCA/IHRlbXBbMF0gOiB1bmRlZmluZWQ7XG4gICAgICBhd2FpdCBEZW5vLmNsb3NlKGlmY29uZmlnLnJpZCk7XG4gICAgICBpZiAoIWFkZHIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgcmVzb2x2ZSB5b3VyIGxvY2FsIGFkcmVzcy4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhZGRyO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBhZGRycyA9IHRleHQubWF0Y2goXG4gICAgICAgIG5ldyBSZWdFeHAoJ2luZXQgKGFkZHI6KT8oWzAtOV0qLil7M31bMC05XSonLCAnZycpXG4gICAgICApO1xuICAgICAgYXdhaXQgRGVuby5jbG9zZShpZmNvbmZpZy5yaWQpO1xuICAgICAgaWYgKCFhZGRycyB8fCAhYWRkcnMuc29tZSgoeCkgPT4gIXguc3RhcnRzV2l0aCgnaW5ldCAxMjcnKSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgcmVzb2x2ZSB5b3VyIGxvY2FsIGFkcmVzcy4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAoXG4gICAgICAgIGFkZHJzICYmXG4gICAgICAgIGFkZHJzXG4gICAgICAgICAgLmZpbmQoKGFkZHI6IHN0cmluZykgPT4gIWFkZHIuc3RhcnRzV2l0aCgnaW5ldCAxMjcnKSlcbiAgICAgICAgICA/LnNwbGl0KCdpbmV0ICcpWzFdXG4gICAgICApO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5sb2coZXJyLm1lc3NhZ2UpO1xuICB9XG59O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEtBQUssQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDLFdBQVc7QUFDL0IsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBYSxHQUFLLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQzs7QUFFekQsTUFBTSxDQUFDLEtBQUssQ0FBQyxjQUFjLGFBQWUsQ0FBQztJQUN6QyxLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLENBQVM7SUFDekMsS0FBSyxDQUFDLE9BQU8sR0FBRyxLQUFLLEdBQUcsQ0FBVSxZQUFHLENBQVU7SUFDL0MsR0FBRyxDQUFDLENBQUM7UUFDSCxHQUFHLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDN0IsR0FBRyxFQUFFLENBQUM7Z0JBQUEsT0FBTztZQUFBLENBQUM7WUFDZCxNQUFNLEVBQUUsQ0FBTztRQUNqQixDQUFDO1FBRUQsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTTtRQUN6QyxFQUFFLEdBQUcsT0FBTyxFQUFFLENBQUM7WUFDYixLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFDLGNBQWM7UUFDdEQsQ0FBQztRQUVELEtBQUssQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNO1FBQ2pDLEtBQUssQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLEdBQUc7UUFFdkIsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDO1lBQ1YsS0FBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBMEIsMkJBQUUsQ0FBSTtZQUNwRSxHQUFHLENBQUMsSUFBSSxHQUFHLEtBQUssR0FDWixLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQW9CLHFCQUFFLENBQUcsT0FDbkQsU0FBUztZQUNiLEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksU0FBUztZQUN2QyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRztZQUM3QixFQUFFLEdBQUcsSUFBSSxFQUFFLENBQUM7Z0JBQ1YsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBc0M7WUFDeEQsQ0FBQztZQUNELE1BQU0sQ0FBQyxJQUFJO1FBQ2IsQ0FBQyxNQUFNLENBQUM7WUFDTixLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQ3RCLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBaUMsa0NBQUUsQ0FBRztZQUVuRCxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRztZQUM3QixFQUFFLEdBQUcsS0FBSyxLQUFLLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFNLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBVTtlQUFJLENBQUM7Z0JBQzVELEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQXNDO1lBQ3hELENBQUM7WUFDRCxNQUFNLENBQ0osS0FBSyxJQUNMLEtBQUssQ0FDRixJQUFJLEVBQUUsSUFBWSxJQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBVTtlQUNqRCxLQUFLLENBQUMsQ0FBTyxRQUFFLENBQUM7UUFFeEIsQ0FBQztJQUNILENBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPO0lBQ3pCLENBQUM7QUFDSCxDQUFDIn0=